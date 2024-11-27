from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from .models import *
# Create your views here.

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
                "message": "Zalogowano pomyślnie!"
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
            'phone_number': user.phone_number if user.phone_number else None
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
        
class RestaurateurRegistrationView(APIView):
    def post(self, request):
        serializer = RestaurateurRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()  # Zapisujemy nowego użytkownika i restaurację
            return Response(
                {"message": "Restaurateur and restaurant created successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)