from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from cloudinary.models import CloudinaryField
from django.utils.crypto import get_random_string
from cloudinary.uploader import destroy

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        
        return self.create_user(email, password, **extra_fields)

class AppUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    
    # Rola użytkownika (klient/restaurator)
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('restaurateur', 'Restaurateur'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')

    # Pola do logowania
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Dodatkowe informacje o kliencie
    phone_number = models.CharField(max_length=15, null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    def has_module_perms(self, app_label):
        return True  # Dostosuj do swoich potrzeb

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
class City(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
class Restaurant(models.Model):
    owner = models.OneToOneField(AppUser, on_delete=models.CASCADE, limit_choices_to={'role': 'restaurateur'})
    name = models.CharField(max_length=255)
    #address = models.TextField()
    phone_number = models.CharField(max_length=15)
    description = models.TextField(null=True, blank=True)
    image = CloudinaryField('image', null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name='restaurants', blank=True)  # Dodano relację
    
    allows_online_payment = models.BooleanField(default=True)
    allows_cash_payment = models.BooleanField(default=True)
    allows_delivery = models.BooleanField(default=False)
    allows_pickup = models.BooleanField(default=True)
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_cities = models.ManyToManyField('City', blank=True)
    #created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
    def delete_image(self):
        if self.image:
            destroy(self.image.public_id)
            self.image = None
            self.save()

class Address(models.Model):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('restaurateur', 'Restaurateur'),
    ]
    
    owner_role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        #related_name='addresses'
        null=True, blank=True
    )
    restaurant = models.ForeignKey(
        'Restaurant',
        on_delete=models.CASCADE,
        null=True, blank=True
    )
    
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    phone_number = models.CharField(max_length=9)
    street = models.CharField(max_length=255)
    building_number = models.PositiveIntegerField()
    apartment_number = models.PositiveIntegerField(null=True, blank=True)
    postal_code = models.CharField(max_length=6)
    city = models.CharField(max_length=100)
    
    def clean(self):
        # Sprawdzenie wymaganych pól w zależności od roli
        if self.owner_role == 'client':
            if not self.user:
                raise ValueError("Client address must be associated with a user.")
            if not self.first_name or not self.last_name:
                raise ValueError("First name and last name are required for client addresses.")
        elif self.owner_role == 'restaurateur':
            if not self.restaurant:
                raise ValueError("Restaurateur address must be associated with a restaurant.")

    def __str__(self):
        #return f"{self.first_name} {self.last_name} - {self.city}"
        return f"{self.city} - {self.street}"

    class Meta:
        verbose_name = "Address"
        verbose_name_plural = "Addresses"
    
    
class Product(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_available = models.BooleanField(default=True)
    image = CloudinaryField('image', null=True, blank=True)
    archived = models.BooleanField(default=False)  # Dodajemy pole archived

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"

    def archive(self):
        self.archived = True
        self.is_available = False
        self.save()
        
    def delete_image(self):
        if self.image:
            destroy(self.image.public_id)
            self.image = None
            self.save()
    
#Cart
class Cart(models.Model):
    session_id = models.CharField(max_length=100, unique=True, null=True ,default=get_random_string)
    created_at = models.DateTimeField(auto_now=True)
    order_id = models.PositiveIntegerField(unique=True, null=True, default=None) 
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)  # Dodajemy pole total_price

    def __str__(self):
        return self.session_id if self.session_id else f"Order {self.order_id}" if self.order_id else "Cart"
    
    def update_timestamp(self):
        self.created_at = timezone.now()
        self.save()
    
    def update_total_price(self):
        self.total_price = sum(item.price * item.quantity for item in self.items.all())
        self.save()

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  
    created_at = models.DateTimeField(auto_now_add=True)  # Dodaj pole created_at

    class Meta:
        ordering = ['created_at']
    
    def save(self, *args, **kwargs):
        self.price = self.product.price 
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
#Order
class Order(models.Model):
    PAYMENT_CHOICES = [
        ('card', 'Card'),
        ('cash', 'Cash'),
        ('online', 'Online'),
    ]

    DELIVERY_CHOICES = [
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('ready_for_pickup', 'Ready for Pickup'),
        ('picked_up', 'Picked Up'),
    ]

    order_id = models.AutoField(primary_key=True)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    address = models.ForeignKey(Address, on_delete=models.CASCADE)#, null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_CHOICES)
    order_notes = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    archived = models.BooleanField(default=False)

    #def __str__(self):
    #    return f"Order {self.order_id} - {self.status}"
    
    def __str__(self):
        return f"Order {self.order_id} - {self.status}" if self.order_id and self.status else "Order"
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            OrderHistory.objects.create(order=self, status=self.status, description="Złożono zamówienie")
            
            # Tworzenie powiadomienia dla restauracji
            notification = Notification.objects.create(
                user=self.restaurant.owner,
                order=self,
                message=f"Nowe zamówienie nr.{self.order_id}.",
            )
            
            # Wysyłanie powiadomienia przez WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'notifications_{self.restaurant.owner.id}',
                {
                    'type': 'send_notification',
                    'message': notification.message,
                    'timestamp': notification.timestamp.isoformat(),
                    'order': self.order_id,
                }
            )
    
    def update_status(self, new_status, description=""):
        self.status = new_status
        OrderHistory.objects.create(order=self, status=new_status, description=description)
        self.save()
        
        notification = Notification.objects.create(
            user=self.user,
            order=self,
            message=f"Status zamówienia nr.{self.order_id} został zmieniony na {new_status}.",
        )
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'notifications_{self.user.id}',
            {
                'type': 'send_notification',
                'message': notification.message,
                'timestamp': notification.timestamp.isoformat(),
                'order': self.order_id,
            }
        )
    
    def archive_if_needed(self):
        if self.status in ['cancelled', 'delivered', 'picked_up'] and self.updated_at <= timezone.now() - timedelta(hours=24):
            self.archived = True
            self.save()
    
class OrderHistory(models.Model):
    order = models.ForeignKey('Order', related_name='history', on_delete=models.CASCADE)
    status = models.CharField(max_length=20)
    timestamp = models.DateTimeField(default=timezone.now)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Order {self.order.order_id} - {self.status} at {self.timestamp}"

class ChatMessage(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='chat_messages', null=True, blank=True)
    room = models.CharField(max_length=255)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        # Jeśli order_id jest dostępne, ustaw room na order_id
        #if self.room:
        #    self.order.order_id = self.room  # Możesz użyć order_id lub innej wartości
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} in {self.room} at {self.timestamp}"
    
class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Notification for {self.user.email} - {self.message}"