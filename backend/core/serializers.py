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
    email = serializers.EmailField(source='user.email', read_only=True)
    class Meta:
        model = Address
        fields = ['id', 'first_name', 'last_name', 'phone_number', 'street', 'building_number', 'apartment_number', 'postal_code', 'city', 'user', 'email']

    extra_kwargs = {
            'apartment_number': {'required': False, 'allow_null': True},
    }
    
    def validate_apartment_number(self, value):
        if value is not None and (value <= 0 or value > 999):
            raise serializers.ValidationError("Numer mieszkania musi być liczbą od 1 do 999 lub pusty.")
        return value

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']
        
class RestaurantSerializer(serializers.ModelSerializer):
    #image_url = serializers.SerializerMethodField()
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Tag.objects.all(), write_only=True, required=False
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
        tags = restaurant_data.pop('tags', [])
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
        restaurant = Restaurant.objects.create(owner=user, **restaurant_data)
        if tags:
            restaurant.tags.set(tags)
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
        fields = ['id', 'restaurant', 'name', 'description', 'price', 'is_available', 'image', 'archived']

#Cart
class CartItemSerializer(serializers.ModelSerializer):
    #product = serializers.StringRelatedField()
    #product = ProductSerializer()
    #product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)
    product = ProductSerializer(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)  # Ustawiamy pole price jako read_only

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'price']#,'product_id'
    
    def validate(self, data):
        print('Validating data:', data)  # Logowanie danych podczas walidacji
        return data

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'session_id', 'created_at', 'total_price', 'items']
        
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
    total_price = serializers.DecimalField(source='cart.total_price', max_digits=10, decimal_places=2, read_only=True)  # Dodajemy pole total_price

    class Meta:
        model = Order
        fields = ['order_id', 'cart', 'items', 'restaurant', 'address', 'user', 'is_paid', 'payment_type', 'delivery_type', 'order_notes', 'status', 'history', 'created_at', 'updated_at', 'total_price']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['user', 'message', 'timestamp']
        
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'timestamp', 'is_read']