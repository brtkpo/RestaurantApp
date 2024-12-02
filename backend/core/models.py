from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from cloudinary.models import CloudinaryField

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
    
class Restaurant(models.Model):
    owner = models.OneToOneField(AppUser, on_delete=models.CASCADE, limit_choices_to={'role': 'restaurateur'})
    name = models.CharField(max_length=255)
    #address = models.TextField()
    phone_number = models.CharField(max_length=15)
    description = models.TextField(null=True, blank=True)
    image = CloudinaryField('image', null=True, blank=True)
    tags = models.ManyToManyField(Tag, related_name='restaurants', blank=True)  # Dodano relację
    #created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

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

    def __str__(self):
        return f"{self.name} - {self.restaurant.name}"