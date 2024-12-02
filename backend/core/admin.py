from django.contrib import admin
from .models import AppUser, Restaurant, Tag

# Register your models here.

admin.site.register(AppUser)

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    search_fields = ['name']

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'phone_number']
    filter_horizontal = ['tags']  # Lepsze UI do wyboru tagów