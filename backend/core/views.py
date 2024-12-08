from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
#from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed, NotFound
from rest_framework.decorators import api_view
#from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.generics import ListAPIView, UpdateAPIView, CreateAPIView, DestroyAPIView, RetrieveAPIView, ListCreateAPIView, RetrieveDestroyAPIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from .models import *
from django.http import JsonResponse
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.utils.crypto import get_random_string
import time
import hashlib

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
            serializer.save()  # Tworzymy użytkownika
            return Response({'message': 'Account created successfully!'}, status=status.HTTP_201_CREATED)
        
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
            if not user:
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

#Address
class AddAddressView(APIView):
    permission_classes = [IsAuthenticated]  # Użytkownik musi być zalogowany

    def post(self, request):
        data = request.data
        # Dodajemy usera automatycznie, bazując na aktualnie zalogowanym użytkowniku
        data['user'] = request.user.id  
        
        serializer = AddressSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Adres dodany pomyślnie!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AddressListView(APIView):
    permission_classes = [IsAuthenticated]  # Użytkownik musi być zalogowany

    def get(self, request):
        addresses = Address.objects.filter(user=request.user)
        serializer = AddressSerializer(addresses, many=True)
        return Response(serializer.data)
    
class DeleteAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            address = Address.objects.get(pk=pk, user=request.user)  # Pobieramy adres na podstawie id i użytkownika
            address.delete()  # Usuwamy adres
            return Response({"message": "Adres usunięty pomyślnie!"}, status=status.HTTP_204_NO_CONTENT)
        except Address.DoesNotExist:
            return Response({"error": "Adres nie znaleziony."}, status=status.HTTP_404_NOT_FOUND)

#Restaurant
class RestaurantRegistrationView(APIView):
    def post(self, request):
        serializer = RestaurateurRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()  # Zapisujemy nowego użytkownika i restaurację
            return Response(
                {"message": "Restaurateur and restaurant created successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#class RestaurantListView(APIView):
#    def get(self, request):
#        restaurants = Restaurant.objects.all()
#        serializer = RestaurantSerializer(restaurants, many=True)
#        return Response(serializer.data)

class RestaurantListView(ListAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer


class RestaurantProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Używamy serializera do zebrania danych użytkownika i jego restauracji
        serializer = RestaurantProfileSerializer(request.user)
        return Response(serializer.data)

class RestaurantUpdateView(UpdateAPIView):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    
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
        # Dodajemy restaurację do produktu podczas zapisywania
        restaurant_id = self.request.data.get('restaurant')
        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            raise serializers.ValidationError('Restaurant not found')

        serializer.save(restaurant=restaurant)
        
class ProductListView(ListAPIView):
    serializer_class = ProductSerializer
    #permission_classes = [IsAuthenticated]

    def get_queryset(self):
        restaurant_id = self.kwargs.get('restaurant_id')

        try:
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except Restaurant.DoesNotExist:
            raise NotFound('Restauracja nie została znaleziona.')

        return Product.objects.filter(restaurant=restaurant)

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
        #cart = Cart.objects.filter(session_id=session_id)
        #print(cart)  # Debugging
        return Cart.objects.filter(session_id=session_id)

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        serializer.save(session_id=session_id)

class CartItemListCreateView(ListCreateAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        cart = Cart.objects.get(session_id=session_id)
        return CartItem.objects.filter(cart=cart)

    def perform_create(self, serializer):
        session_id = self.kwargs['session_id']
        product_id = self.request.data.get('product_id')
        quantity = self.request.data.get('quantity', 1)
        
        print(f"Received data: product_id={product_id}, quantity={quantity}")  # Dodajemy logowanie

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found")

        cart, created = Cart.objects.get_or_create(session_id=session_id)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity
        cart_item.save()

class CartItemRetrieveDestroyView(RetrieveDestroyAPIView):
    queryset = CartItem.objects.all()
    serializer_class = CartItemSerializer

    def get_queryset(self):
        session_id = self.kwargs['session_id']
        cart = Cart.objects.get(session_id=session_id)
        return CartItem.objects.filter(cart=cart)