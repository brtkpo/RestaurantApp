import django
django.setup()

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken  # Jeśli używasz JWT
from core.models import ChatMessage, AppUser  # Użyj AppUser, jeśli to Twój model użytkownika
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Dodajemy do grupy WebSocket
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Usuwamy z grupy WebSocket
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Odbieramy wiadomość z WebSocket
        try:
            text_data_json = json.loads(text_data)
            message = text_data_json['message']
            user = await self.get_user(id=2)
            # Wywołanie funkcji zapisu w bazie danych
            await self.save_message(message, user)

            # Wysyłamy wiadomość do wszystkich użytkowników w grupie
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message
                }
            )
        except json.JSONDecodeError:
            logger.error("Received invalid JSON")
            
    @database_sync_to_async
    def get_user(self, id):
        return AppUser.objects.get(id=id)

    # Funkcja zapisująca wiadomość do bazy danych
    @database_sync_to_async
    def save_message(self, message, user):
        # Zapisz wiadomość w bazie danych
        ChatMessage.objects.create(room=self.room_name, user=user, message=message)

    async def chat_message(self, event):
        message = event['message']
        await self.send(text_data=json.dumps({
            'message': message
        }))