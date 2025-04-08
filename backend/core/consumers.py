import django
django.setup()

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async, async_to_sync 
from rest_framework_simplejwt.tokens import AccessToken  
from core.models import ChatMessage, AppUser, Notification, Order  
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        token = self.scope['query_string'].decode().split('=')[1]
        try:
            access_token = AccessToken(token)
            self.user = await sync_to_async(AppUser.objects.get)(id=access_token['user_id'])
            
            user_role = self.user.role 
            if user_role == 'restaurateur':
                logger.info(f"User {self.user.email} is a restaurateur.")
            elif user_role == 'client':
                logger.info(f"User {self.user.email} is a client.")
            else:
                logger.info(f"User {self.user.email} has an unknown role: {user_role}")
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            user = await self.get_user(id=self.user.id) 

            order_id = self.room_group_name.split('_')[1]  
            order = await self.get_order(order_id)
            
            if order.archived:
                await self.send(text_data=json.dumps({'error': 'Nie można dodawać wiadomości do zarchiwizowanego zamówienia.'}))
                return
            
            chat_message = await self.save_message(message, user, order)
            
            logger.info(f"chat_message: {chat_message}") 

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        #'user': user.email,
                        'user': chat_message.user.id,
                        'message': chat_message.message,
                        'timestamp': chat_message.timestamp.isoformat()
                    }
                }
            )
        except json.JSONDecodeError:
            logger.error("Received invalid JSON")
            
    @database_sync_to_async
    def get_user(self, id):
        return AppUser.objects.get(id=id)
    
    @database_sync_to_async
    def get_order(self, order_id):
        return Order.objects.get(order_id=order_id)

    @database_sync_to_async
    def save_message(self, message, user, order):
        chat_message = ChatMessage.objects.create(room=self.room_name, user=user, message=message, order=order)
        
        if user.role == 'client':
            recipient = order.restaurant.owner
        else:
            recipient = order.user
        
        notification = Notification.objects.create(
            user=recipient,
            order=order,
            message=f"Nowa wiadomość w zamówieniu nr.{order.order_id}",
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{recipient.id}',
            {
                'type': 'send_notification',
                'message': notification.message,
                'timestamp': notification.timestamp.isoformat(),
                'order': order.order_id
            }
        )
        
        return chat_message

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps(message))
    
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'timestamp': event['timestamp'],
            'order': event['order'],
        }))
        
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['query_string'].decode().split('=')[1]
        try:
            access_token = AccessToken(token)
            self.user = await sync_to_async(AppUser.objects.get)(id=access_token['user_id'])
            self.room_group_name = f'notifications_{self.user.id}'

            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'): 
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'timestamp': event['timestamp'],
            'order': event['order'],
        }))