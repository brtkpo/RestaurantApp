from django.contrib import admin
from .models import AppUser, Restaurant, Tag, City, Order, Address, Cart, CartItem, OrderHistory, ChatMessage
from django.urls import reverse
from django.utils.html import format_html

# Register your models here.

admin.site.register(AppUser)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ['name']
    
admin.site.register(City)

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'phone_number']
    filter_horizontal = ['tags']  # Lepsze UI do wyboru tagów
    
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['street', 'city', 'user', 'restaurant']
    search_fields = ['street', 'city', 'user__email', 'restaurant__name']

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'created_at', 'total_price', 'order_id']
    search_fields = ['session_id']
    inlines = [CartItemInline]
    
class OrderHistoryInline(admin.TabularInline):
    model = OrderHistory
    extra = 1

class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0

    def get_queryset(self, request):
        # Filtruj wiadomości czatu na podstawie room_name (np. order_id)
        order_id = self.parent_object.order_id  # Przypuśćmy, że order_id jest dostępne w obiekcie zamówienia
        return super().get_queryset(request).filter(room=order_id)
    
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'restaurant', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'created_at', 'updated_at']
    search_fields = ['order_id', 'user__email', 'restaurant__name']
    inlines = [OrderHistoryInline, ChatMessageInline]

    readonly_fields = ['chat_messages_link']

    def chat_messages_link(self, obj):
        # Link do API zamiast admina
        url = reverse("chat-messages", kwargs={"room_name": obj.order_id})  # Używaj order_id jako room_name
        return format_html('<a href="{}" target="_blank">Zobacz wiadomości</a>', url)

    chat_messages_link.short_description = "Wiadomości na czacie"