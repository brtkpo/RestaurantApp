from rest_framework import serializers
from .models import *

class UserDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ['id', 'role']

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUser
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 'role']
        extra_kwargs = {
            'password': {'write_only': True} 
        }

    def create(self, validated_data):
        user = AppUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number')
        )
        user.role = validated_data.get('role', 'client')   
        user.save()
        return user

class AddressSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = Address
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'street', 'building_number', 'apartment_number', 'postal_code', 'city', 'user', 'email', 'owner_role', 'restaurant', 'archived']

    extra_kwargs = {
            'apartment_number': {'required': False, 'allow_null': True},
    }
    
    def validate_apartment_number(self, value):
        if value is not None and (value <= 0 or value > 999):
            raise serializers.ValidationError("Numer mieszkania musi być liczbą od 1 do 999 lub pusty.")
        return value

    def validate(self, data):
        errors = {}
        if data['owner_role'] == 'client':
            if not data.get('first_name'):
                errors['first_name'] = "First name is required for client addresses."
            if not data.get('last_name'):
                errors['last_name'] = "Last name is required for client addresses."
        if errors:
            raise serializers.ValidationError(errors)
        return data

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        
class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']
        
class RestaurantSerializer(serializers.ModelSerializer):
    #image_url = serializers.SerializerMethodField()
    delivery_cities = CitySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )
    
    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'phone_number', 'description', 'image', 'tags', 'tag_ids','allows_online_payment', 'allows_cash_payment', 'allows_delivery', 'allows_pickup', 'minimum_order_amount', 'delivery_cities']
        #fields = ['name', 'address', 'phone_number', 'description']        

class RestaurantWithAddressSerializer(serializers.ModelSerializer):
    address = AddressSerializer(source='address_set', many=True, read_only=True)
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
    )

    class Meta:
        model = Restaurant
        fields = ['id', 'name', 'phone_number', 'description', 'image', 'tags', 'tag_ids','allows_online_payment', 'allows_cash_payment', 'allows_delivery', 'allows_pickup', 'minimum_order_amount', 'owner', 'address']

class RestaurateurRegistrationSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer()

    class Meta:
        model = AppUser
        fields = ['email', 'password', 'first_name', 'last_name', 'phone_number', 'restaurant']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        restaurant_data = validated_data.pop('restaurant')
        tags = restaurant_data.pop('tags', [])
        validated_data['role'] = 'restaurateur'  

        user = AppUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone_number=validated_data.get('phone_number'),
            role='restaurateur'
        )

        restaurant = Restaurant.objects.create(owner=user, **restaurant_data)
        if tags:
            restaurant.tags.set(tags)
        return user

class RestaurantProfileSerializer(serializers.ModelSerializer):
    restaurant = RestaurantSerializer(read_only=True)  

    class Meta:
        model = AppUser
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'role', 'restaurant']
        
#Product
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'is_available', 'image', 'archived']

#Cart
class CartItemSerializer(serializers.ModelSerializer):
    #product = serializers.StringRelatedField()
    #product = ProductSerializer()
    #product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)
    product = ProductSerializer(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)  
    #restaurant = RestaurantSerializer(source='product.restaurant', read_only=True)  
    created_at = serializers.DateTimeField(read_only=True) 

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'price', 'created_at']#,'product_id'
    
    def validate(self, data):
        #print('Validating data:', data)  
        return data

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    restaurant = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'session_id', 'created_at', 'total_price', 'items','restaurant']
        
    def get_restaurant(self, obj):
        first_item = obj.items.first()
        if first_item:
            return RestaurantSerializer(first_item.product.restaurant).data
        return None
        
#Order
class OrderHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderHistory
        fields = ['id', 'status', 'timestamp', 'description']

class OrderSerializer(serializers.ModelSerializer):
    history = OrderHistorySerializer(many=True, read_only=True)
    items = CartItemSerializer(many=True, read_only=True, source='cart.items')

    class Meta:
        model = Order
        fields = ['order_id', 'cart', 'items', 'restaurant', 'address', 'user', 'is_paid', 'payment_type', 'delivery_type', 'order_notes', 'status', 'history', 'created_at', 'updated_at']

class OrderViewSerializer(serializers.ModelSerializer):
    history = OrderHistorySerializer(many=True, read_only=True)
    items = CartItemSerializer(many=True, read_only=True, source='cart.items')
    address = AddressSerializer(read_only=True)
    restaurant = RestaurantSerializer(read_only=True)  
    total_price = serializers.DecimalField(source='cart.total_price', max_digits=10, decimal_places=2, read_only=True)  

    class Meta:
        model = Order
        fields = ['order_id', 'cart', 'items', 'restaurant', 'address', 'user', 'is_paid', 'payment_type', 'delivery_type', 'order_notes', 'status', 'history', 'created_at', 'updated_at', 'total_price', 'archived']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['user', 'message', 'timestamp']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'order', 'message', 'is_read', 'timestamp']