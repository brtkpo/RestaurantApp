from rest_framework import serializers
from .models import *

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 'role']
        extra_kwargs = {
            'password': {'write_only': True}  # Hasło będzie tylko do zapisu, nie do odczytu
        }

    def create(self, validated_data):
        # Tworzenie nowego użytkownika
        user = AppUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number')
        )
        user.role = validated_data.get('role', 'client')  # Domyślnie ustawiamy rolę na `client`
        user.save()
        return user

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'street', 'building_number', 'apartment_number', 'postal_code', 'city', 'user']
        
class RestaurantSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['name', 'phone_number', 'description', 'image', 'image_url']
        #fields = ['name', 'address', 'phone_number', 'description']
        
    def get_image_url(self, obj):
        # Jeśli obrazek jest obecny, zwróć pełny URL, w przeciwnym razie zwróć None
        if obj.image:
            return f'https://res.cloudinary.com/dljau5sfr/{obj.image}'
            #return f'{obj.image}'
        return None

class RestaurateurRegistrationSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer()

    class Meta:
        model = AppUser
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 'restaurant']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Wyciągamy dane restauracji
        restaurant_data = validated_data.pop('restaurant')
        validated_data['role'] = 'restaurateur'  # Ustawiamy rolę na restaurator
        # Tworzymy użytkownika
        user = AppUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role='restaurateur'
        )
        # Tworzymy restaurację
        Restaurant.objects.create(owner=user, **restaurant_data)
        return user