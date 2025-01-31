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
    extra = 1

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if hasattr(self, 'parent_object') and self.parent_object:
            return qs.filter(room=self.parent_object.order_id)
        return qs.none()

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_id', 'user', 'restaurant', 'status', 'created_at', 'updated_at', 'archived', 'restaurant']
    list_filter = ['status', 'created_at', 'updated_at', 'archived', 'restaurant'] 
    search_fields = ['order_id', 'user__email', 'restaurant__name']
    inlines = [OrderHistoryInline, ChatMessageInline]

    def get_inline_instances(self, request, obj=None):
        inline_instances = super().get_inline_instances(request, obj)
        for inline in inline_instances:
            if isinstance(inline, ChatMessageInline):
                inline.parent_object = obj
        return inline_instances