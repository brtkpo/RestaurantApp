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

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        
class RestaurantSerializer(serializers.ModelSerializer):
    #image_url = serializers.SerializerMethodField()
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True
    )
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'phone_number', 'description', 'image', 'tags', 'tag_ids']#'image_url', 'tags', 'tag_ids']
        #fields = ['name', 'address', 'phone_number', 'description']
        
    #def get_image_url(self, obj):
    #    # Jeśli obrazek jest obecny, zwróć pełny URL, w przeciwnym razie zwróć None
    #    if obj.image:
    #        return f'https://res.cloudinary.com/dljau5sfr/{obj.image}'
    #        #return f'{obj.image}'
    #    return None

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

class RestaurantProfileSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)  # Dodajemy dane restauracji

    class Meta:
        model = AppUser
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'role', 'restaurant']
        
#Product
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'is_available']

#Cart
class CartItemSerializer(serializers.ModelSerializer):
    #product = serializers.StringRelatedField()
    #product = ProductSerializer()
    #product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)
    product = ProductSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity']#,'product_id'
    
    #def get_product(self, obj):
    #    return {
    #        'name': obj.product.name,
    #        'restaurant': obj.product.restaurant.name,
    #        'price': obj.product.price,
    #    }

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'session_id', 'created_at', 'items']
        
#Order
class OrderHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderHistory
        fields = ['id', 'status', 'timestamp', 'description']

class OrderSerializer(serializers.ModelSerializer):
    history = OrderHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['order_id', 'cart', 'restaurant', 'address', 'is_paid', 'payment_type', 'delivery_type', 'order_notes', 'status', 'history', 'created_at', 'updated_at']
