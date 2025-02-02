from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
#from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotFound, PermissionDenied
from rest_framework.decorators import api_view
#from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import ListAPIView, UpdateAPIView, CreateAPIView, DestroyAPIView, RetrieveAPIView, ListCreateAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView, GenericAPIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count
from .serializers import *
from .models import *
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.utils.crypto import get_random_string
import time
import hashlib
import stripe
from django.http import HttpResponseRedirect

#User
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Zalogowano pomyślnie!",
                "role": user.role,
            }, status=status.HTTP_200_OK)
        return Response({"message": "Błąd logowania!"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def clientRegister(request):
    if request.method == 'POST':
        email = request.data.get('email')
        
        # Sprawdzenie, czy email istnieje
        if AppUser.objects.filter(email=email).exists():
            return Response(
                {'message': 'Email is already taken.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ClientSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()  # Tworzymy użytkownika
            refresh = RefreshToken.for_user(user)
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "konto utworzone pomyślnie!",
                "role": user.role,
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
      
class UserProfileView(APIView):
    #authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Pobieramy dane aktualnie zalogowanego użytkownika
        user = request.user
        user_data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone_number': user.phone_number if user.phone_number else None,
            'role': user.role,
        }
        return Response(user_data)
    
class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user = request.user

            # Sprawdzenie, czy użytkownik istnieje
            if not AppUser.objects.filter(id=user.id).exists():
                return Response(
                    {"message": "Nie znaleziono użytkownika."},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Usuwanie użytkownika
            user.delete()
            return Response(
                {"message": "Konto zostało usunięte."},
                status=status.HTTP_200_OK
            )

        except AuthenticationFailed as e:
            return Response(
                {"message": "Błąd uwierzytelnienia: " + str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

        except Exception as e:
            # Ogólny wyjątek dla innych błędów
            return Response(
                {"message": "Wystąpił błąd: " + str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserDetailsView(RetrieveAPIView):
    queryset = AppUser.objects.all()
    serializer_class = UserDetailsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

#Address
class AddAddressView(APIView):
    permission_classes = [IsAuthenticated]  # Użytkownik musi być zalogowany

    def post(self, request):
        data = request.data
        user = request.user
        # Dodajemy usera automatycznie, bazując na aktualnie zalogowanym użytkowniku
        data['user'] = user.id  
        data['owner_role'] = user.role  
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"owner_role: {user.role}")
        
        if user.role == 'restaurateur':
            # Sprawdzamy, czy użytkownik ma już zapisany adres
            if Address.objects.filter(user=user).exists():
                return Response({'error': 'Adres już istnieje dla tego użytkownika.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Przypisujemy restaurant_id na podstawie user.id
            try:
                restaurant = Restaurant.objects.get(owner_id=user.id)
                data['restaurant'] = restaurant.id
                logger.info(f"restaurant_id: {restaurant.id}")
            except Restaurant.DoesNotExist:
                return Response({'error': 'Restauracja nie istnieje dla tego użytkownika.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if data.get('apartment_number') == '':
            data['apartment_number'] = None
        
        serializer = AddressSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Adres dodany pomyślnie!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AddressListView(APIView):
    permission_classes = [IsAuthenticated]  # Użytkownik musi być zalogowany

    def get(self, request):
        addresses = Address.objects.filter(user=request.user, archived=False)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data)
    
class DeleteAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            address = Address.objects.get(pk=pk, user=request.user)  # Pobieramy adres na podstawie id i użytkownika
            address.archived = True  # Oznaczamy adres jako zarchiwizowany
            address.save()  # Usuwamy adres
            return Response({"message": "Adres usunięty pomyślnie!"}, status=status.HTTP_204_NO_CONTENT)
        except Address.DoesNotExist:
            return Response({"error": "Adres nie znaleziony."}, status=status.HTTP_404_NOT_FOUND)

#import logging
#logger = logging.getLogger(__name__)

#Restaurant
class RestaurantRegistrationView(CreateAPIView):
    queryset = AppUser.objects.all()
    serializer_class = RestaurateurRegistrationSerializer

    def perform_create(self, serializer):
        user = serializer.save()  # Zapisujemy nowego użytkownika i restaurację
        refresh = RefreshToken.for_user(user)
        self.token_data = {
            "message": "restaurator i restauracja utworzona pomyślnie!",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Sprawdzenie, czy email istnieje
        if AppUser.objects.filter(email=email).exists():
            return Response(
                {'message': 'Email jest już zajęty.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(self.token_data, status=status.HTTP_201_CREATED, headers=headers)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class RestaurantListView(ListAPIView):
    serializer_class = RestaurantWithAddressSerializer

    def get_queryset(self):
        city = self.request.query_params.get('city', None)
        if city:
            return Restaurant.objects.filter(
                address__city__iexact=city, address__isnull=False
            ).distinct() | Restaurant.objects.filter(
                delivery_cities__name__iexact=city
            ).distinct()
        return Restaurant.objects.filter(address__isnull=False).distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if not queryset.exists():
            city = self.request.query_params.get('city', None)
            if city:
                return Response({"error": f"Brak restauracji w mieście: {city}"}, status=status.HTTP_404_NOT_FOUND)
            return Response({"error": "Nie znaleziono restauracji"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RestaurantProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Używamy serializera do zebrania danych użytkownika i jego restauracji
        serializer = RestaurantProfileSerializer(request.user)
        return Response(serializer.data)

class RestaurantUpdateView(UpdateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if instance.owner != request.user:
            return Response({"detail": "Nie masz uprawnień do aktualizacji tej restauracji."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Check if allows_delivery is True and delivery_cities is empty
        if serializer.validated_data.get('allows_delivery') and not instance.delivery_cities.exists():
            serializer.validated_data['allows_delivery'] = False
            return Response({"message": "Musisz dodać miasta dostawy, aby umożliwić dostawę."}, status=status.HTTP_400_BAD_REQUEST)

        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)
    
class CityListView(ListAPIView):
    """
    GET: Zwraca listę wszystkich unikalnych nazw miast dla adresów restauracji
    """
    def get(self, request, *args, **kwargs):
        # Miasta z adresów restauracji
        address_cities = Address.objects.filter(owner_role='restaurateur').values('city').annotate(count=Count('city')).order_by('city')
        address_city_names = {city['city'] for city in address_cities}

        # Miasta dostawy
        delivery_cities = City.objects.all().values('name').annotate(count=Count('name')).order_by('name')
        delivery_city_names = {city['name'] for city in delivery_cities}

        # Połączenie obu zestawów miast
        all_city_names = sorted(address_city_names.union(delivery_city_names))

        return Response(all_city_names, status=status.HTTP_200_OK)
    
#DeliveryCity
class AddDeliveryCityView(CreateAPIView):
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        restaurant_id = self.kwargs.get('restaurant_id')
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if restaurant.owner != request.user:
            raise PermissionDenied("You do not have permission to modify this restaurant's delivery cities.")
        
        city_name = request.data.get('name')
        if not city_name:
            return Response({"error": "City name is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        city, created = City.objects.get_or_create(name=city_name)
        restaurant.delivery_cities.add(city)
        restaurant.save()
        
        return Response({"message": "City added successfully"}, status=status.HTTP_201_CREATED)

class RemoveDeliveryCityView(DestroyAPIView):
    serializer_class = CitySerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        restaurant_id = self.kwargs.get('restaurant_id')
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if restaurant.owner != request.user:
            raise PermissionDenied("You do not have permission to modify this restaurant's delivery cities.")
        
        city_id = request.data.get('id')
        if not city_id:
            return Response({"error": "City ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            city = City.objects.get(id=city_id)
        except City.DoesNotExist:
            return Response({"error": "City not found"}, status=status.HTTP_404_NOT_FOUND)
        
        restaurant.delivery_cities.remove(city)
        restaurant.save()
        
        return Response({"message": "City removed successfully"}, status=status.HTTP_200_OK)
    
#Cloudinary
def generateUploadSignature(request):
    # Pobranie public_id z query params lub wygenerowanie domyślnego
    public_id = request.GET.get('public_id', get_random_string(10))  # Jeśli brak public_id, generujemy losowe
    timestamp = str(int(time.time()))  # Timestamp w sekundach
    upload_preset = 'ml_default'  # Twój upload preset (możesz go zmienić w zależności od konfiguracji Cloudinary)

    # Pobieramy konfigurację Cloudinary
    api_key = cloudinary.config().api_key
    api_secret = cloudinary.config().api_secret

    # Logowanie: Sprawdzamy, czy api_key i api_secret są poprawne
    print("Cloudinary Config:", api_key, api_secret)

    if not api_key or not api_secret:
        return JsonResponse({"error": "Cloudinary API key or secret not found in configuration."}, status=400)

    # Parametry do podpisu - uwzględniamy `upload_preset`
    signature_string = f"public_id={public_id}&timestamp={timestamp}&upload_preset={upload_preset}{api_secret}"

    # Tworzymy podpis
    signature = hashlib.sha1(signature_string.encode('utf-8')).hexdigest()

    # Zwracamy dane do frontend (API key, timestamp, signature, public_id)
    response_data = {
        'api_key': api_key,
        'timestamp': timestamp,
        'signature': signature,
        'public_id': public_id,
    }

    return JsonResponse(response_data)

class DeleteRestaurantImageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk)
            if restaurant.owner != request.user:
                return Response({"error": "Nie masz uprawnień do usunięcia zdjęcia tej restauracji."}, status=status.HTTP_403_FORBIDDEN)
            restaurant.delete_image()
            return Response({"message": "Zdjęcie profilowe restauracji zostało usunięte."}, status=status.HTTP_200_OK)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restauracja nie została znaleziona."}, status=status.HTTP_404_NOT_FOUND)

class DeleteProductImageView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
            if product.restaurant.owner != request.user:
                return Response({"error": "Nie masz uprawnień do usunięcia zdjęcia tego produktu."}, status=status.HTTP_403_FORBIDDEN)
            product.delete_image()
            return Response({"message": "Zdjęcie produktu zostało usunięte."}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({"error": "Produkt nie został znaleziony."}, status=status.HTTP_404_NOT_FOUND)

#Tags
class TagListView(APIView):
    """
    GET: Zwraca listę wszystkich tagów
    """
    def get(self, request):
        tags = Tag.objects.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TagCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Sprawdzenie, czy tag o takiej nazwie już istnieje
        existing_tag = Tag.objects.filter(name=request.data.get('name')).first()
        if existing_tag:
            return Response(
                {"error": "Tag o takiej nazwie już istnieje."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
   
class RestaurantTagListView(APIView):
    def get(self, request, pk):
        try:
            # Pobranie restauracji
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)

        # Serializowanie przypisanych tagów
        tags = restaurant.tags.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class FilterRestaurantsByTagsView(APIView):
    def get(self, request):
        # Pobranie tagów z parametrów zapytania
        tag_names = request.query_params.getlist('tags')

        if not tag_names:
            return Response({"error": "No tags provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Filtrowanie restauracji według tagów
        restaurants = Restaurant.objects.filter(tags__name__in=tag_names).distinct()

        # Serializowanie wyników
        serializer = RestaurantSerializer(restaurants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class RestaurantTagUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)
        
        tag_ids = request.data.get('tag_ids', [])
        tags = Tag.objects.filter(id__in=tag_ids)
        
        # Dodanie tagów do restauracji
        restaurant.tags.set(tags)
        restaurant.save()
        
        # Serializowanie zaktualizowanych tagów
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            restaurant = Restaurant.objects.get(pk=pk)
        except Restaurant.DoesNotExist:
            return Response({"error": "Restaurant not found"}, status=status.HTTP_404_NOT_FOUND)
        
        tag_ids = request.data.get('tag_ids', [])
        tags = Tag.objects.filter(id__in=tag_ids)
        
        # Usunięcie tagów z restauracji
        restaurant.tags.remove(*tags)
        restaurant.save()
        
        return Response({"message": "Tags removed successfully"}, status=status.HTTP_200_OK)

#Product
class ProductCreateView(CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        restaurant_id = self.request.data.get('restaurant')
        if not Restaurant.objects.filter(id=restaurant_id).exists():
            raise serializers.ValidationError({'restaurant': 'Restaurant not found'})
        restaurant = Restaurant.objects.get(id=restaurant_id)
        serializer.save(restaurant=restaurant)
    
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        product_id = response.data['id']
        return Response({'id': product_id, 'message': 'Produkt dodany pomyślnie!'}, status=response.status_code)
        
class ProductListView(ListAPIView):
    serializer_class = ProductSerializer
    #permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('restaurant_id')

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            raise NotFound('Restauracja nie została znaleziona.')

        return Product.objects.filter(restaurant=restaurant, is_available=True)
    
class AllProductListView(ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('restaurant_id')

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            raise NotFound('Restauracja nie została znaleziona.')

        return Product.objects.filter(restaurant=restaurant, archived=False)


class ProductDeleteView(DestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs.get('pk')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise NotFound('Produkt nie został znaleziony.')
        return product

    def perform_destroy(self, instance):
        instance.archive()
    
class ProductUpdateView(UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs.get('pk')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise NotFound('Produkt nie został znaleziony.')
        return product

class ProductDetailView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        product_id = self.kwargs.get('pk')
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise NotFound('Produkt nie został znaleziony.')
        return product
    
#Cart
class CartListCreateView(ListCreateAPIView):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        cart = Cart.objects.filter(session_id=session_id).first()
        if cart:
            # Usuń produkty, które nie są dostępne
            CartItem.objects.filter(cart=cart, product__is_available=False).delete()
        
        stale_carts = Cart.objects.filter(created_at__lt=timezone.now() - timedelta(hours=24), order_id__isnull=True)
        for stale_cart in stale_carts:
            CartItem.objects.filter(cart=stale_cart).delete()
            stale_cart.delete()
            #stale_cart.update_timestamp() 
            
        return Cart.objects.filter(session_id=session_id)

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        serializer.save(session_id=session_id)

class CartItemListCreateView(ListCreateAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        ##cart = Cart.objects.get(session_id=session_id)
        
        # Sprawdzenie i czyszczenie wszystkich koszyków, które nie były aktualizowane w ciągu ostatnich 24 godzin
        stale_carts = Cart.objects.filter(created_at__lt=timezone.now() - timedelta(hours=24), order_id__isnull=True)
        print(f"Stale carts to delete: {stale_carts}")
        for stale_cart in stale_carts:
            CartItem.objects.filter(cart=stale_cart).delete()
            stale_cart.delete()
            #stale_cart.update_timestamp()  # Zaktualizuj timestamp koszyka
        
        cart = Cart.objects.get(session_id=session_id)
        return CartItem.objects.filter(cart=cart)
    
    #def perform_create(self, serializer):
    #    session_id = self.kwargs['session_id']
    #    cart, created = Cart.objects.get_or_create(session_id=session_id)
    #    serializer.save(cart=cart)

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        product_id = self.request.data.get('product')
        quantity = self.request.data.get('quantity', 1)

        print(f"Creating cart item: session_id={session_id}, product_id={product_id}, quantity={quantity}")
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            print(f"Product with ID {product_id} not found")
            raise serializers.ValidationError("Product not found")
        
        cart, created = Cart.objects.get_or_create(session_id=session_id)
        cart.update_timestamp() 
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()
        cart.update_total_price()
        return Response(CartItemSerializer(cart_item).data, status=status.HTTP_201_CREATED)

class CartItemRetrieveUpdateDestroyView(RetrieveUpdateDestroyAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        cart = Cart.objects.get(session_id=session_id)
        return CartItem.objects.filter(cart=cart)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        print('Received data:', request.data) 
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            print('Validation errors:', serializer.errors)  # Logowanie błędów walidacji
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        cart = instance.cart
        cart.update_total_price()  # Aktualizujemy wartość koszyka po zmianie ilości produktu

        return Response(serializer.data)
    
class ClearCartItemsFromOtherRestaurantsView(DestroyAPIView):
    def delete(self, request, session_id, restaurant_id, *args, **kwargs):
        try:
            cart = Cart.objects.get(session_id=session_id)
        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)

        # Usuń produkty z koszyka, które nie należą do podanej restauracji
        CartItem.objects.filter(cart=cart).exclude(product__restaurant_id=restaurant_id).delete()

        return Response({"message": "Produkty z innych restauracji zostały usunięte z koszyka."}, status=status.HTTP_200_OK)

import logging

logger = logging.getLogger(__name__)

class CartRestaurantInfoView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RestaurantSerializer

    def get(self, request, *args, **kwargs):
        cart_id = kwargs.get('cart_id')
        try:
            cart = Cart.objects.get(id=cart_id)
            cart_item = CartItem.objects.filter(cart=cart).first()
            if not cart_item:
                return Response({"error": "Koszyk jest pusty."}, status=status.HTTP_404_NOT_FOUND)
            
            restaurant = cart_item.product.restaurant
            serializer = self.get_serializer(restaurant)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Cart.DoesNotExist:
            return Response({"error": "Koszyk nie istnieje."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching restaurant info for cart {cart_id}: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#Order
class OrderListCreateView(ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if user.role != 'client':
            raise serializers.ValidationError({"error": "Nie jesteś klientem i nie możesz złożyć zamówienia."})
        
        address_id = self.request.data.get('address')
        delivery_type = self.request.data.get('delivery_type')
        if address_id:
            try:
                address = Address.objects.get(id=address_id)
                if address.archived:
                    raise serializers.ValidationError({"error": "Adres jest zarchiwizowany i nie może być użyty do zamówienia."})
                user = address.user  # Uzyskujemy użytkownika z adresu
            except Address.DoesNotExist:
                raise serializers.ValidationError({"error": "Address not found"})
         
        cart_id = self.request.data.get('cart')
        if cart_id:
            try:
                cart = Cart.objects.get(id=cart_id)
                total_price = sum(item.product.price * item.quantity for item in CartItem.objects.filter(cart=cart))
                restaurant = CartItem.objects.filter(cart=cart).first().product.restaurant
                if total_price < restaurant.minimum_order_amount:
                    raise serializers.ValidationError({"error": f"Minimalna kwota zamówienia dla {restaurant.name} to {restaurant.minimum_order_amount} PLN"})
                if delivery_type == 'delivery' and address.city not in restaurant.delivery_cities.values_list('name', flat=True):
                    raise serializers.ValidationError({"error": f"Restauracja {restaurant.name} nie dostarcza do miasta {address.city}"})
            except Cart.DoesNotExist:
                raise serializers.ValidationError({"error": "Cart not found"})
            
        order = serializer.save()
        if cart_id:
            cart.order_id = order.order_id
            cart.session_id = None
            cart.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except serializers.ValidationError as e:
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {"order_id": serializer.instance.order_id},
            status=status.HTTP_201_CREATED,
            headers=headers
        )

import logging
logger = logging.getLogger('django')

class OrderDetailView(RetrieveUpdateAPIView):
    #queryset = Order.objects.filter(archived=False)
    queryset = Order.objects.all()
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        order = self.get_object()
        if not hasattr(request.user, 'restaurant') or request.user.restaurant.id != order.restaurant.id:
            return Response({'error': 'Nie masz uprawnień do przeglądania tego zamówienia.'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        order = self.get_object()
        order.archive_if_needed()
        if order.archived:
            return Response({'error': 'Nie można modyfikować zarchiwizowanego zamówienia.'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        #logger.warning(f"restaurant User {request.user.restaurant.id} order {order.order_id}")
        #logger.warning(order.restaurant.id)

        if not hasattr(request.user, 'restaurant') or request.user.restaurant.id != order.restaurant.id:
            #logger.warning(f"User {request.user.restaurant.id} does not have permission to update order {order.order_id}")
            return Response({'error': 'Nie masz uprawnień do modyfikacji tego zamówienia.'}, status=status.HTTP_403_FORBIDDEN)
        # Update order status and history
        if 'status' in data:
            order.update_status(data['status'], data.get('description', ""))
            #notification = Notification.objects.create(
            #    user=order.user,
            #    order=order,
            #    message=f"Status zamówienia nr.{order.order_id} został zmieniony na {data['status']}.",
            #)
            #channel_layer = get_channel_layer()
            #async_to_sync(channel_layer.group_send)(
            #    f'notifications_{order.user.id}',
            #    {
            #        'type': 'send_notification',
            #        'message': notification.message,
            #        'timestamp': notification.timestamp.isoformat(),
            #        'order': order.order_id,
            #    }
            #)

        serializer = self.get_serializer(order, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

class UserOrderListView(ListAPIView):
    
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        orders = Order.objects.filter(user=user, archived=False).order_by('-created_at')
        for order in orders:
            order.archive_if_needed()
        return orders

class UserOrderDetailView(RetrieveAPIView):
    
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        orders = Order.objects.filter(user=user)
        for order in orders:
            order.archive_if_needed()
        return orders

class RestaurantOrdersView(ListAPIView):
    #serializer_class = OrderSerializer
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs['restaurant_id']
        orders = Order.objects.filter(restaurant_id=restaurant_id, archived=False)
        for order in orders:
            order.archive_if_needed()
        return orders
    
#ArchivedOrder
class ArchivedUserOrderListView(ListAPIView):
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Order.objects.filter(user=user, archived=True).order_by('-created_at')

class ArchivedRestaurantOrdersView(ListAPIView):
    serializer_class = OrderViewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs['restaurant_id']
        return Order.objects.filter(restaurant_id=restaurant_id, archived=True).order_by('-created_at')

#Payment
stripe.api_key = settings.STRIPE_SECRET_KEY

class CreateCheckoutSessionView(APIView):
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            order_id = request.data.get('orderId')
            restaurant = request.data.get('restaurant')
            total_amount = request.data.get('totalAmount')
            
            print('Received data:', request.data)  # Logowanie danych odbieranych przez serwer
            total_amount_cents = int(float(total_amount) * 100)
            # Tworzenie sesji Stripe Checkout
            session = stripe.checkout.Session.create(
                customer_email = email,
                
                payment_method_types=['card', 'blik', 'p24'], 
                line_items=[{
                    'price_data': {
                        'currency': 'pln',
                        'product_data': {'name': f'{restaurant} - zamówienie nr. {order_id}'},
                        'unit_amount': total_amount_cents,  # Kwota w groszach, 1000 to 10 PLN
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'http://localhost:8000/api/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}',
                #success_url='http://localhost:3000/user',
                #cancel_url='http://localhost:3000/user?payment=fail', 
                cancel_url=f'http://localhost:3000/user/orders/{order_id}?payment=fail',
                metadata={'order_id': order_id},# Zmienna adresu anulowania
            )

            # Zwrócenie odpowiedzi z ID sesji
            return Response({'id': session.id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            print('Error:', str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SuccessPaymentView(APIView):
    def get(self, request, *args, **kwargs):
        session_id = request.GET.get('session_id')
        order_id = request.GET.get('order_id')

        try:
            order = Order.objects.get(order_id=order_id)
            order.is_paid = True
            order.save()

            # Dodanie wpisu do OrderHistory
            OrderHistory.objects.create(
                order=order,
                status=order.status,
                description="zapłacone"
            )
            
            notification = Notification.objects.create(
                user=order.restaurant.owner,
                order=order,
                message=f"Zamówienie nr.{order.order_id} zostało opłacone.",
            )

            # Wysyłanie powiadomienia przez WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'notifications_{order.restaurant.owner.id}',
                {
                    'type': 'send_notification',
                    'message': notification.message,
                    'timestamp': notification.timestamp.isoformat()
                }
            )

            return HttpResponseRedirect(f'http://localhost:3000/user/orders/{order_id}?payment=success')
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        
#Chat
class ChatMessageListView(ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        room_name = self.kwargs['room_name']
        return ChatMessage.objects.filter(room=room_name).order_by('timestamp')
    
#Notification
class UnreadNotificationsListView(ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_read=False)

class MarkNotificationAsReadView(UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.instance.is_read = True
        serializer.save()
        
class MarkNotificationsAsReadByOrderView(UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        order_id = self.kwargs['order_id']
        return Notification.objects.filter(order__order_id=order_id, user=self.request.user)

    def update(self, request, *args, **kwargs):
            notifications = self.get_queryset()
            if not notifications.exists():
                return Response({'error': 'No notifications found or you do not have permission to mark them as read.'}, status=status.HTTP_404_NOT_FOUND)
            notifications.update(is_read=True)
            return Response({'status': 'notifications marked as read'}, status=status.HTTP_200_OK)