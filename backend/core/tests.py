from unittest.mock import patch, call
from decimal import Decimal
import hashlib
import time
from django.utils import timezone
from datetime import timedelta
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.http import JsonResponse
from .models import *
from .serializers import *
import cloudinary

#User
class UserLoginTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(email='testuser@example.com', password='testpass')

    def test_login_user(self):
        url = reverse('login')
        data = {
            'username': 'testuser@example.com',
            'password': 'testpass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
    def test_login_user_invalid_password(self):
        url = reverse('login')
        data = {
            'username': 'testuser@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertNotIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        
class UserRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_user(self):
        url = reverse('register')
        data = {
            'email': 'newuser@example.com',
            'password': 'newpass',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AppUser.objects.filter(email='newuser@example.com').exists())
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['message'], 'konto utworzone pomyślnie!')

    def test_register_user_existing_email(self):
        AppUser.objects.create_user(email='existinguser@example.com', password='testpass')
        url = reverse('register')
        data = {
            'email': 'existinguser@example.com',
            'password': 'newpass',
            'first_name': 'John',
            'last_name': 'Doe'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Email is already taken.')

    def test_register_user_invalid_data(self):
        url = reverse('register')
        data = {
            'email': 'invalidemail',
            'password': 'newpass',
            'first_name': '',
            'last_name': ''
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        
class UserProfileTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            phone_number='123456789',
            role='client'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_user_profile(self):
        url = reverse('user-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['last_name'], 'Doe')
        self.assertEqual(response.data['email'], 'testuser@example.com')
        self.assertEqual(response.data['phone_number'], '123456789')
        self.assertEqual(response.data['role'], 'client')

    def test_get_user_profile_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('user-profile')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class DeleteUserTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            phone_number='123456789',
            role='client'
        )
        self.client.force_authenticate(user=self.user)

    def test_delete_user(self):
        url = reverse('delete-user')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Konto zostało usunięte.')
        self.assertFalse(AppUser.objects.filter(email='testuser@example.com').exists())

    def test_delete_user_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('delete-user')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_nonexistent_user(self):
        self.client.force_authenticate(user=None)  
        non_existent_user = AppUser.objects.create_user(
            email='nonexistent@example.com',
            password='testpass',
            first_name='Non',
            last_name='Existent'
        )
        non_existent_user.delete() 
        self.client.force_authenticate(user=non_existent_user)  
        url = reverse('delete-user')
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['message'], 'Nie znaleziono użytkownika.')
        
class UserDetailsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            phone_number='123456789',
            role='client'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_user_details(self):
        url = reverse('user-details')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = UserDetailsSerializer(self.user)
        self.assertEqual(response.data, serializer.data)

    def test_get_user_details_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('user-details')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

#Address
class AddressListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            role='client'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Jane',
            last_name='Smith',
            role='client'
        )
        self.address1 = Address.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            phone_number='123456789',
            street='Main St',
            building_number=123,
            apartment_number=4,
            postal_code='12345',
            city='Sample City'
        )
        self.address2 = Address.objects.create(
            user=self.other_user,
            first_name='Jane',
            last_name='Smith',
            phone_number='987654321',
            street='Second St',
            building_number=456,
            apartment_number=7,
            postal_code='54321',
            city='Another City'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_addresses(self):
        url = reverse('address_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['first_name'], 'John')
        self.assertEqual(response.data[0]['last_name'], 'Doe')

    def test_get_addresses_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('address_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_other_user_addresses(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('address_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['first_name'], 'Jane')
        self.assertEqual(response.data[0]['last_name'], 'Smith')

class AddAddressTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            role='client'
        )
        self.restaurant_owner = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.restaurant_owner,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.client.force_authenticate(user=self.user)

    def test_add_address(self):
        url = reverse('add_address')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '123456789',
            'street': 'Main St',
            'building_number': 123,
            'apartment_number': 4,
            'postal_code': '12-345',
            'city': 'Sample City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Address.objects.filter(user=self.user, city='Sample City').exists())

    def test_add_address_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('add_address')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '123456789',
            'street': 'Main St',
            'building_number': 123,
            'apartment_number': 4,
            'postal_code': '12-345',
            'city': 'Sample City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_address_invalid_data(self):
        url = reverse('add_address')
        data = {
            'first_name': '',
            'last_name': '',
            'phone_number': '123456789',
            'street': 'Main St',
            'building_number': '12',
            'apartment_number': '',
            'postal_code': '12-345',
            'city': 'Sample City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        
    def test_add_address_no_building_data(self):
        url = reverse('add_address')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '123456789',
            'street': 'Main St',
            'building_number': '',
            'apartment_number': '',
            'postal_code': '12-345',
            'city': 'Sample City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('building_number', response.data)

    def test_add_address_restaurateur(self):
        self.client.force_authenticate(user=self.restaurant_owner)
        url = reverse('add_address')
        data = {
            'phone_number': '123456789',
            'street': 'Main St',
            'building_number': 123,
            'apartment_number': 4,
            'postal_code': '12-345',
            'city': 'Sample City'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Address.objects.filter(restaurant=self.restaurant, city='Sample City').exists())
        
class DeleteAddressTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass',
            first_name='John',
            last_name='Doe',
            role='client'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Jane',
            last_name='Smith',
            role='client'
        )
        self.address = Address.objects.create(
            user=self.user,
            first_name='John',
            last_name='Doe',
            phone_number='123456789',
            street='Main St',
            building_number=123,
            apartment_number=4,
            postal_code='12345',
            city='Sample City'
        )
        self.other_address = Address.objects.create(
            user=self.other_user,
            first_name='Jane',
            last_name='Smith',
            phone_number='987654321',
            street='Second St',
            building_number=456,
            apartment_number=7,
            postal_code='54321',
            city='Another City'
        )
        self.client.force_authenticate(user=self.user)

    def test_delete_address(self):
        url = reverse('delete_address', args=[self.address.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Address.objects.filter(id=self.address.id).exists())

    def test_delete_address_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('delete_address', args=[self.address.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_nonexistent_address(self):
        url = reverse('delete_address', args=[9999])  
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Adres nie znaleziony.')

    def test_delete_other_user_address(self):
        url = reverse('delete_address', args=[self.other_address.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Adres nie znaleziony.')
        
#Restaurant
class RestaurantRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_restaurateur(self):
        url = reverse('register_restaurateur')
        data = {
            'email': 'newrestaurateur@example.com',
            'password': 'newpass',
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '123456789',
            'restaurant': {
                'name': 'New Restaurant',
                'phone_number': '987654321'
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AppUser.objects.filter(email='newrestaurateur@example.com').exists())
        self.assertTrue(Restaurant.objects.filter(name='New Restaurant').exists())
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['message'], 'restaurator i restauracja utworzona pomyślnie!')

    def test_register_restaurateur_existing_email(self):
        AppUser.objects.create_user(email='existinguser@example.com', password='testpass')
        url = reverse('register_restaurateur')
        data = {
            'email': 'existinguser@example.com',
            'password': 'newpass',
            'first_name': 'John',
            'last_name': 'Doe',
            'phone_number': '123456789',
            'restaurant': {
                'name': 'New Restaurant',
                'phone_number': '987654321'
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Email jest już zajęty.')

    def test_register_restaurateur_invalid_data(self):
        url = reverse('register_restaurateur')
        data = {
            'email': 'invalidemail',
            'password': 'newpass',
            'first_name': '',
            'last_name': '',
            'phone_number': '123456789',
            'restaurant': {
                'name': '',
                'phone_number': ''
            }
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('first_name', response.data)
        self.assertIn('last_name', response.data)
        self.assertIn('restaurant', response.data)
        
class RestaurantListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.city1 = City.objects.create(name='Sample City')
        self.city2 = City.objects.create(name='Another City')
        
        self.user1 = AppUser.objects.create_user(
            email='owner1@example.com',
            password='testpass',
            first_name='Owner1',
            last_name='Restaurant1',
            role='restaurateur'
        )
        self.user2 = AppUser.objects.create_user(
            email='owner2@example.com',
            password='testpass',
            first_name='Owner2',
            last_name='Restaurant2',
            role='restaurateur'
        )
        
        self.restaurant1 = Restaurant.objects.create(
            owner=self.user1,
            name='Restaurant 1',
            phone_number='123456789'
        )
        self.restaurant2 = Restaurant.objects.create(
            owner=self.user2,
            name='Restaurant 2',
            phone_number='987654321'
        )
        
        self.address1 = Address.objects.create(
            user=self.user1,
            restaurant=self.restaurant1,
            street='Main St',
            building_number=123,
            city='Sample City',
            postal_code='12345',
            phone_number='123456789'
        )
        self.address2 = Address.objects.create(
            user=self.user2,
            restaurant=self.restaurant2,
            street='Second St',
            building_number=456,
            city='Another City',
            postal_code='54321',
            phone_number='987654321'
        )
        self.restaurant2.delivery_cities.add(self.city1)

    def test_get_restaurants(self):
        url = reverse('restaurant-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_restaurants_by_city(self):
        url = reverse('restaurant-list') + '?city=Sample City'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_get_restaurants_by_city_not_found(self):
        url = reverse('restaurant-list') + '?city=Nonexistent City'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Brak restauracji w mieście: Nonexistent City')

    def test_get_restaurants_not_found(self):
        Address.objects.all().delete()
        url = reverse('restaurant-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Nie znaleziono restauracji')
        
class RestaurantProfileTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.other_restaurant = Restaurant.objects.create(
            owner=self.other_user,
            name='Other Restaurant',
            phone_number='987654321'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_own_restaurant_profile(self):
        url = reverse('restaurant_user')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['restaurant']['name'], 'Test Restaurant')

    def test_get_restaurant_profile_unauthenticated(self):
        self.client.force_authenticate(user=None)  
        url = reverse('restaurant_user')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_other_user_restaurant_profile(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('restaurant_user')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['restaurant']['name'], 'Other Restaurant')

class RestaurantUpdateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.other_restaurant = Restaurant.objects.create(
            owner=self.other_user,
            name='Other Restaurant',
            phone_number='987654321'
        )
        self.client.force_authenticate(user=self.user)

    def test_update_own_restaurant(self):
        url = reverse('restaurant-detail', args=[self.restaurant.id])
        data = {
            'name': 'Updated Restaurant',
            'phone_number': '111222333'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.restaurant.refresh_from_db()
        self.assertEqual(self.restaurant.name, 'Updated Restaurant')
        self.assertEqual(self.restaurant.phone_number, '111222333')

    def test_update_restaurant_unauthenticated(self):
        self.client.force_authenticate(user=None)
        url = reverse('restaurant-detail', args=[self.restaurant.id])
        data = {
            'name': 'Updated Restaurant',
            'phone_number': '111222333'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_other_user_restaurant(self):
        self.client.force_authenticate(user=self.other_user)
        url = reverse('restaurant-detail', args=[self.restaurant.id])
        data = {
            'name': 'Updated Restaurant',
            'phone_number': '111222333'
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], 'Nie masz uprawnień do aktualizacji tej restauracji.')

    def test_update_restaurant_allows_delivery_without_cities(self):
        url = reverse('restaurant-detail', args=[self.restaurant.id])
        data = {
            'name': 'Test Restaurant',
            'phone_number': '123456789',
            'allows_delivery': True
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['message'], 'Musisz dodać miasta dostawy, aby umożliwić dostawę.')
        
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import AppUser, Restaurant, Address, City

class CityListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789',
            allows_delivery=True  # Upewniamy się, że dostawa jest dostępna
        )
        self.address1 = Address.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            street='Main St',
            building_number=123,
            city='Sample City',
            postal_code='12345',
            phone_number='123456789',
            owner_role='restaurateur'
        )
        self.city1 = City.objects.create(name='Sample City')
        self.city2 = City.objects.create(name='Another City')
        self.restaurant.delivery_cities.add(self.city1)  # Dodajemy miasto dostawy do restauracji

    def test_get_city_list(self):
        url = reverse('city-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, ['Another City', 'Sample City'])
 
#DeliveryCity       
class AddDeliveryCityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789',
            allows_delivery=True
        )
        self.city1 = City.objects.create(name='Sample City')
        self.city2 = City.objects.create(name='Another City')

    def test_add_delivery_city(self):
        url = reverse('add-delivery-city', args=[self.restaurant.id])
        data = {'name': 'New City'}
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(self.restaurant.delivery_cities.filter(name='New City').exists())

    def test_add_delivery_city_unauthenticated(self):
        url = reverse('add-delivery-city', args=[self.restaurant.id])
        data = {'name': 'New City'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_add_delivery_city_nonexistent_restaurant(self):
        url = reverse('add-delivery-city', args=[9999])  # Nieistniejąca restauracja
        data = {'name': 'New City'}
        self.client.force_authenticate(user=self.user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Restaurant not found')

    def test_add_delivery_city_other_user(self):
        url = reverse('add-delivery-city', args=[self.restaurant.id])
        data = {'name': 'New City'}
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "You do not have permission to modify this restaurant's delivery cities.")
        
class RemoveDeliveryCityTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789',
            allows_delivery=True
        )
        self.city1 = City.objects.create(name='Sample City')
        self.city2 = City.objects.create(name='Another City')
        self.restaurant.delivery_cities.add(self.city1)

    def test_remove_delivery_city(self):
        url = reverse('remove-delivery-city', args=[self.restaurant.id])
        data = {'id': self.city1.id}
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(self.restaurant.delivery_cities.filter(id=self.city1.id).exists())

    def test_remove_delivery_city_unauthenticated(self):
        url = reverse('remove-delivery-city', args=[self.restaurant.id])
        data = {'id': self.city1.id}
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_remove_delivery_city_nonexistent_restaurant(self):
        url = reverse('remove-delivery-city', args=[9999])  # Nieistniejąca restauracja
        data = {'id': self.city1.id}
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Restaurant not found')

    def test_remove_delivery_city_other_user(self):
        url = reverse('remove-delivery-city', args=[self.restaurant.id])
        data = {'id': self.city1.id}
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "You do not have permission to modify this restaurant's delivery cities.")

#Cloudinary
class GenerateUploadSignatureTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('generate_upload_signature')

    def test_generate_upload_signature(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('api_key', data)
        self.assertIn('timestamp', data)
        self.assertIn('signature', data)
        self.assertIn('public_id', data)

    def test_generate_upload_signature_with_public_id(self):
        public_id = 'test_public_id'
        response = self.client.get(self.url, {'public_id': public_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['public_id'], public_id)

    def test_generate_upload_signature_missing_api_key_or_secret(self):
        # Backup original configuration
        original_api_key = cloudinary.config().api_key
        original_api_secret = cloudinary.config().api_secret

        # Set configuration to None
        cloudinary.config().api_key = None
        cloudinary.config().api_secret = None

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertEqual(data['error'], 'Cloudinary API key or secret not found in configuration.')

        # Restore original configuration
        cloudinary.config().api_key = original_api_key
        cloudinary.config().api_secret = original_api_secret

    def test_generate_upload_signature_correct_signature(self):
        public_id = 'test_public_id'
        timestamp = str(int(time.time()))
        upload_preset = 'ml_default'
        api_key = cloudinary.config().api_key
        api_secret = cloudinary.config().api_secret

        signature_string = f"public_id={public_id}&timestamp={timestamp}&upload_preset={upload_preset}{api_secret}"
        expected_signature = hashlib.sha1(signature_string.encode('utf-8')).hexdigest()

        response = self.client.get(self.url, {'public_id': public_id, 'timestamp': timestamp})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['signature'], expected_signature)

#Tag
class TagListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.tag1 = Tag.objects.create(name='Tag1')
        self.tag2 = Tag.objects.create(name='Tag2')

    def test_get_tag_list(self):
        url = reverse('tag-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Tag1')
        self.assertEqual(response.data[1]['name'], 'Tag2')

class TagCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='testuser@example.com',
            password='testpass'
        )
        self.tag = Tag.objects.create(name='ExistingTag')

    def test_create_tag(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('tag-add')
        data = {'name': 'NewTag'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'NewTag')
        self.assertTrue(Tag.objects.filter(name='NewTag').exists())

    def test_create_tag_unauthenticated(self):
        url = reverse('tag-add')
        data = {'name': 'NewTag'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_existing_tag(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('tag-add')
        data = {'name': 'ExistingTag'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'Tag o takiej nazwie już istnieje.')

    def test_create_tag_invalid_data(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('tag-add')
        data = {'name': ''}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

class RestaurantTagListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = AppUser.objects.create_user(
            email='owner1@example.com',
            password='testpass',
            first_name='Owner1',
            last_name='Restaurant1',
            role='restaurateur'
        )
        self.user2 = AppUser.objects.create_user(
            email='owner2@example.com',
            password='testpass',
            first_name='Owner2',
            last_name='Restaurant2',
            role='restaurateur'
        )
        self.restaurant1 = Restaurant.objects.create(
            owner=self.user1,
            name='Restaurant 1',
            phone_number='123456789'
        )
        self.restaurant2 = Restaurant.objects.create(
            owner=self.user2,
            name='Restaurant 2',
            phone_number='987654321'
        )
        self.tag1 = Tag.objects.create(name='Tag1')
        self.tag2 = Tag.objects.create(name='Tag2')
        self.tag3 = Tag.objects.create(name='Tag3')

        self.restaurant1.tags.add(self.tag1, self.tag2)
        self.restaurant2.tags.add(self.tag2, self.tag3)

    def test_get_tags_for_restaurant1(self):
        url = reverse('restaurant-tag-list', args=[self.restaurant1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Tag1')
        self.assertEqual(response.data[1]['name'], 'Tag2')

    def test_get_tags_for_restaurant2(self):
        url = reverse('restaurant-tag-list', args=[self.restaurant2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Tag2')
        self.assertEqual(response.data[1]['name'], 'Tag3')
        
class FilterRestaurantsByTagsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = AppUser.objects.create_user(
            email='owner1@example.com',
            password='testpass',
            first_name='Owner1',
            last_name='Restaurant1',
            role='restaurateur'
        )
        self.user2 = AppUser.objects.create_user(
            email='owner2@example.com',
            password='testpass',
            first_name='Owner2',
            last_name='Restaurant2',
            role='restaurateur'
        )
        self.restaurant1 = Restaurant.objects.create(
            owner=self.user1,
            name='Restaurant 1',
            phone_number='123456789'
        )
        self.restaurant2 = Restaurant.objects.create(
            owner=self.user2,
            name='Restaurant 2',
            phone_number='987654321'
        )
        self.tag1 = Tag.objects.create(name='Tag1')
        self.tag2 = Tag.objects.create(name='Tag2')
        self.tag3 = Tag.objects.create(name='Tag3')

        self.restaurant1.tags.add(self.tag1, self.tag2)
        self.restaurant2.tags.add(self.tag2, self.tag3)

    def test_filter_restaurants_by_tags(self):
        url = reverse('filter-restaurants-by-tags')
        response = self.client.get(url, {'tags': ['Tag1', 'Tag2']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Restaurant 1')
        self.assertEqual(response.data[1]['name'], 'Restaurant 2')

    def test_filter_restaurants_by_single_tag(self):
        url = reverse('filter-restaurants-by-tags')
        response = self.client.get(url, {'tags': ['Tag3']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Restaurant 2')

    def test_filter_restaurants_no_tags_provided(self):
        url = reverse('filter-restaurants-by-tags')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'No tags provided')

    def test_filter_restaurants_no_matching_tags(self):
        url = reverse('filter-restaurants-by-tags')
        response = self.client.get(url, {'tags': ['NonexistentTag']})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
class RestaurantTagUpdateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.tag1 = Tag.objects.create(name='Tag1')
        self.tag2 = Tag.objects.create(name='Tag2')
        self.tag3 = Tag.objects.create(name='Tag3')

    def test_add_tags_to_restaurant(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('restaurant-tag-update', args=[self.restaurant.id])
        data = {'tag_ids': [self.tag1.id, self.tag2.id]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Tag1')
        self.assertEqual(response.data[1]['name'], 'Tag2')

    def test_remove_tags_from_restaurant(self):
        self.client.force_authenticate(user=self.user)
        self.restaurant.tags.add(self.tag1, self.tag2)
        url = reverse('restaurant-tag-update', args=[self.restaurant.id])
        data = {'tag_ids': [self.tag1.id, self.tag2.id]}
        response = self.client.delete(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Tags removed successfully')
        self.assertFalse(self.restaurant.tags.filter(id=self.tag1.id).exists())
        self.assertFalse(self.restaurant.tags.filter(id=self.tag2.id).exists())

    def test_update_tags_unauthenticated(self):
        url = reverse('restaurant-tag-update', args=[self.restaurant.id])
        data = {'tag_ids': [self.tag1.id, self.tag2.id]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_tags_nonexistent_restaurant(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('restaurant-tag-update', args=[9999])  # Nieistniejąca restauracja
        data = {'tag_ids': [self.tag1.id, self.tag2.id]}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Restaurant not found')

#Product
class ProductCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )

    def test_create_product(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('add-product')
        data = {
            'name': 'New Product',
            'description': 'Product description',
            'price': 10.99,
            'restaurant': self.restaurant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['message'], 'Produkt dodany pomyślnie!')
        self.assertTrue(Product.objects.filter(name='New Product').exists())

    def test_create_product_unauthenticated(self):
        url = reverse('add-product')
        data = {
            'name': 'New Product',
            'description': 'Product description',
            'price': 10.99,
            'restaurant': self.restaurant.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product_nonexistent_restaurant(self):
        self.client.force_authenticate(user=self.user)
        url = reverse('add-product')
        data = {
            'name': 'New Product',
            'description': 'Product description',
            'price': 10.99,
            'restaurant': 999  
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['restaurant'][0], 'Invalid pk "999" - object does not exist.')
        #print(response.data)
        #'restaurant': [ErrorDetail(string='Invalid pk "999" - object does not exist.', code='does_not_exist')] przed blokiem z bledem w widoku
        #self.assertEqual(response.data['restaurant'][0], 'Restaurant not found')
        
class ProductListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product1 = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=10.99,
            restaurant=self.restaurant,
            is_available=True
        )
        self.product2 = Product.objects.create(
            name='Product 2',
            description='Description 2',
            price=15.99,
            restaurant=self.restaurant,
            is_available=True
        )
        self.client.force_authenticate(user=self.user)  # Dodanie uwierzytelnienia

    def test_get_products(self):
        url = reverse('product-list', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Product 1')
        self.assertEqual(response.data[1]['name'], 'Product 2')

    def test_get_products_no_products(self):
        self.product1.delete()
        self.product2.delete()
        url = reverse('product-list', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_products_nonexistent_restaurant(self):
        url = reverse('product-list', args=[9999])  # Nieistniejąca restauracja
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Restauracja nie została znaleziona.')
        
class AllProductListTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product1 = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=10.99,
            restaurant=self.restaurant,
            archived=False
        )
        self.product2 = Product.objects.create(
            name='Product 2',
            description='Description 2',
            price=15.99,
            restaurant=self.restaurant,
            archived=False
        )
        self.client.force_authenticate(user=self.user)  # Dodanie uwierzytelnienia

    def test_get_all_products(self):
        url = reverse('product-list', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['name'], 'Product 1')
        self.assertEqual(response.data[1]['name'], 'Product 2')

    def test_get_all_products_no_products(self):
        self.product1.delete()
        self.product2.delete()
        url = reverse('product-list', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_get_all_products_nonexistent_restaurant(self):
        url = reverse('product-list', args=[9999])  # Nieistniejąca restauracja
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Restauracja nie została znaleziona.')
        
class ProductDeleteTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=10.99,
            restaurant=self.restaurant,
            archived=False
        )
        self.client.force_authenticate(user=self.user)  # Dodanie uwierzytelnienia

    def test_delete_product(self):
        url = reverse('product-delete', args=[self.product.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(Product.objects.get(id=self.product.id).archived)

    def test_delete_product_unauthenticated(self):
        self.client.force_authenticate(user=None)
        url = reverse('product-delete', args=[self.product.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_nonexistent_product(self):
        url = reverse('product-delete', args=[9999])  # Nieistniejący produkt
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Produkt nie został znaleziony.')
        
class ProductUpdateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=Decimal('10.99'),
            restaurant=self.restaurant,
            archived=False
        )
        self.client.force_authenticate(user=self.user)  # Dodanie uwierzytelnienia

    def test_update_product(self):
        url = reverse('update-product', args=[self.product.id])
        data = {
            'name': 'Updated Product',
            'description': 'Updated Description',
            'price': '12.99',
            'restaurant': self.restaurant.id  # Dodanie pola restaurant
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, 'Updated Product')
        self.assertEqual(self.product.description, 'Updated Description')
        self.assertEqual(self.product.price, Decimal('12.99'))

    def test_update_product_unauthenticated(self):
        self.client.force_authenticate(user=None)
        url = reverse('update-product', args=[self.product.id])
        data = {
            'name': 'Updated Product',
            'description': 'Updated Description',
            'price': '12.99',
            'restaurant': self.restaurant.id  # Dodanie pola restaurant
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_nonexistent_product(self):
        url = reverse('update-product', args=[9999])  # Nieistniejący produkt
        data = {
            'name': 'Updated Product',
            'description': 'Updated Description',
            'price': '12.99',
            'restaurant': self.restaurant.id  # Dodanie pola restaurant
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Produkt nie został znaleziony.')

class ProductDetailTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='owner@example.com',
            password='testpass',
            first_name='Owner',
            last_name='Restaurant',
            role='restaurateur'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=Decimal('10.99'),
            restaurant=self.restaurant,
            archived=False
        )
        self.client.force_authenticate(user=self.user)  # Dodanie uwierzytelnienia

    def test_get_product_detail(self):
        url = reverse('product-detail', args=[self.product.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Product 1')
        self.assertEqual(response.data['description'], 'Description 1')
        self.assertEqual(response.data['price'], '10.99')

    def test_get_product_detail_unauthenticated(self):
        self.client.force_authenticate(user=None)
        url = reverse('product-detail', args=[self.product.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_nonexistent_product_detail(self):
        url = reverse('product-detail', args=[9999])  # Nieistniejący produkt
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['detail'], 'Produkt nie został znaleziony.')
        
#Cart
class CartListCreateTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='customer'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=10.99,
            restaurant=self.restaurant,
            is_available=True
        )
        self.session_id = 'testsession123'
        self.cart = Cart.objects.create(session_id=self.session_id)
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

    def test_create_cart(self):
        new_session_id = 'newsession123'  
        url = reverse('cart-detail', args=[new_session_id])
        data = {
            'session_id': new_session_id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['session_id'], new_session_id)

    def test_get_cart(self):
        url = reverse('cart-detail', args=[self.session_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['session_id'], self.session_id)

    def test_remove_unavailable_products(self):
        self.product.is_available = False
        self.product.save()
        url = reverse('cart-detail', args=[self.session_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data[0]['items']), 0)  # Sprawdź, czy lista items jest pusta

def test_remove_stale_carts(self):
        stale_date = timezone.now() - timedelta(days=2)
        stale_cart = Cart.objects.create(session_id='stalesession123', created_at=stale_date)
        url = reverse('cart-detail', args=['stalesession123'])
        response = self.client.get(url)
        print(response.data)  # Dodanie printa
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        self.assertFalse(Cart.objects.filter(session_id='stalesession123').exists())

class CartItemListCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.session_id = 'testsession123'
        
        # Tworzenie użytkownika
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        
        # Tworzenie restauracji
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        
        # Tworzenie produktu
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        
        # Tworzenie koszyka
        self.cart = Cart.objects.create(session_id=self.session_id)
        self.cart_item = CartItem.objects.create(
            cart=self.cart,
            product=self.product,
            quantity=2
        )
    
    def test_get_cart_items(self):
        url = reverse('cartitem-list-create', args=[self.session_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['product']['name'], 'Test Product')
        self.assertEqual(response.data[0]['quantity'], 2)
    
    def test_create_cart_item_with_invalid_product(self):
        url = reverse('cartitem-list-create', args=[self.session_id])
        data = {
            'product': 9999,  # Nieistniejący produkt
            'quantity': 1
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Product not found', str(response.data))
        
class CartItemRetrieveUpdateDestroyViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.session_id = 'testsession123'
        self.cart = Cart.objects.create(session_id=self.session_id)
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

    def test_retrieve_cart_item(self):
        url = reverse('cartitem-detail', args=[self.session_id, self.cart_item.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['product']['name'], 'Test Product')
        self.assertEqual(response.data['quantity'], 2)

    def test_update_cart_item(self):
        url = reverse('cartitem-detail', args=[self.session_id, self.cart_item.id])
        data = {
            'quantity': 3
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cart_item.refresh_from_db()
        self.assertEqual(self.cart_item.quantity, 3)

    def test_delete_cart_item(self):
        url = reverse('cartitem-detail', args=[self.session_id, self.cart_item.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CartItem.objects.filter(id=self.cart_item.id).exists())

    def test_update_cart_item_invalid_data(self):
        url = reverse('cartitem-detail', args=[self.session_id, self.cart_item.id])
        data = {
            'quantity': -1  # Invalid quantity
        }
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data)
        
class ClearCartItemsFromOtherRestaurantsViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user1 = AppUser.objects.create_user(
            email='user1@example.com',
            password='testpass',
            first_name='User1',
            last_name='Test1',
            role='client'
        )
        self.user2 = AppUser.objects.create_user(
            email='user2@example.com',
            password='testpass',
            first_name='User2',
            last_name='Test2',
            role='client'
        )
        self.restaurant1 = Restaurant.objects.create(
            owner=self.user1,
            name='Restaurant 1',
            phone_number='123456789'
        )
        self.restaurant2 = Restaurant.objects.create(
            owner=self.user2,
            name='Restaurant 2',
            phone_number='987654321'
        )
        self.product1 = Product.objects.create(
            name='Product 1',
            description='Description 1',
            price=Decimal('10.99'),
            restaurant=self.restaurant1,
            is_available=True
        )
        self.product2 = Product.objects.create(
            name='Product 2',
            description='Description 2',
            price=Decimal('15.99'),
            restaurant=self.restaurant2,
            is_available=True
        )
        self.session_id = 'testsession123'
        self.cart = Cart.objects.create(session_id=self.session_id)
        self.cart_item1 = CartItem.objects.create(cart=self.cart, product=self.product1, quantity=2)
        self.cart_item2 = CartItem.objects.create(cart=self.cart, product=self.product2, quantity=1)

    def test_clear_cart_items_from_other_restaurants(self):
        url = reverse('clear-cart-items', args=[self.session_id, self.restaurant1.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(CartItem.objects.filter(cart=self.cart, product=self.product1).exists())
        self.assertFalse(CartItem.objects.filter(cart=self.cart, product=self.product2).exists())

    def test_clear_cart_items_cart_not_found(self):
        url = reverse('clear-cart-items', args=['invalidsession', self.restaurant1.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Cart not found', str(response.data))

class CartRestaurantInfoViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)  # Authenticate the client
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

    def test_get_restaurant_info(self):
        url = reverse('cart-restaurant-info', args=[self.cart.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Restaurant')

    def test_get_restaurant_info_empty_cart(self):
        empty_cart = Cart.objects.create(session_id='emptysession123')
        url = reverse('cart-restaurant-info', args=[empty_cart.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Koszyk jest pusty.', str(response.data))

    def test_get_restaurant_info_cart_not_found(self):
        url = reverse('cart-restaurant-info', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Koszyk nie istnieje.', str(response.data))
        
#Order
class OrderListCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789',
            minimum_order_amount=Decimal('20.00')
        )
        self.restaurant.delivery_cities.add(self.city)
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=3) 

    def test_create_order_with_valid_cart_and_address(self):
        url = reverse('order-list-create')
        data = {
            'cart': self.cart.id,
            'address': self.address.id,
            'delivery_type': 'delivery',
            'restaurant': self.restaurant.id,
            'user': self.user.id,
            'payment_type': 'card'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('order_id', response.data)

    def test_create_order_with_invalid_address(self):
        url = reverse('order-list-create')
        data = {
            'cart': self.cart.id,
            'address': 9999,  
            'delivery_type': 'delivery',
            'restaurant': self.restaurant.id,
            'user': self.user.id,
            'payment_type': 'card'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid pk "9999" - object does not exist', str(response.data))

    def test_create_order_with_invalid_cart(self):
        url = reverse('order-list-create')
        data = {
            'cart': 9999,  
            'address': self.address.id,
            'delivery_type': 'delivery',
            'restaurant': self.restaurant.id,
            'user': self.user.id,
            'payment_type': 'card'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid pk "9999" - object does not exist', str(response.data))

    def test_create_order_below_minimum_order_amount(self):
        self.cart_item.quantity = 1
        self.cart_item.save()
        url = reverse('order-list-create')
        data = {
            'cart': self.cart.id,
            'address': self.address.id,
            'delivery_type': 'delivery',
            'restaurant': self.restaurant.id,
            'user': self.user.id,
            'payment_type': 'card'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Minimalna kwota zamówienia', str(response.data))

    def test_create_order_delivery_outside_delivery_cities(self):
        other_city = City.objects.create(name='Other City')
        self.address.city = other_city.name
        self.address.save()
        url = reverse('order-list-create')
        data = {
            'cart': self.cart.id,
            'address': self.address.id,
            'delivery_type': 'delivery',
            'restaurant': self.restaurant.id,
            'user': self.user.id,
            'payment_type': 'card'
        }
        self.cart_item.quantity = 3  
        self.cart_item.save()
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('nie dostarcza do miasta', str(response.data))
        
class OrderDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    def test_retrieve_order_with_valid_permissions(self):
        url = reverse('order-detail', args=[self.order.order_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_id'], self.order.order_id)

    def test_retrieve_order_with_invalid_permissions(self):
        other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='client'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('order-detail', args=[self.order.order_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Nie masz uprawnień do przeglądania tego zamówienia.', str(response.data))

    def test_update_order_with_valid_permissions(self):
        url = reverse('order-detail', args=[self.order.order_id])
        data = {
            'status': 'confirmed'  
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'confirmed')

    def test_update_order_with_invalid_permissions(self):
        other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='client'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('order-detail', args=[self.order.order_id])
        data = {
            'status': 'confirmed'  
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Nie masz uprawnień do modyfikacji tego zamówienia.', str(response.data))

    def test_update_archived_order(self):
        self.order.archived = True
        self.order.save()
        url = reverse('order-detail', args=[self.order.order_id])
        data = {
            'status': 'confirmed'  
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Nie można modyfikować zarchiwizowanego zamówienia.', str(response.data))
        
class UserOrderListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    def test_retrieve_user_orders_with_orders(self):
        url = reverse('user-order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['order_id'], self.order.order_id)

    def test_retrieve_user_orders_with_no_orders(self):
        self.order.delete()
        url = reverse('user-order-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
class RestaurantOrdersViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    def test_retrieve_restaurant_orders_with_orders(self):
        url = reverse('restaurant-orders', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['order_id'], self.order.order_id)

    def test_retrieve_restaurant_orders_with_no_orders(self):
        self.order.delete()
        url = reverse('restaurant-orders', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
class UserOrderDetailViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    def test_retrieve_user_order_with_valid_permissions(self):
        url = reverse('user-order-detail', args=[self.order.order_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['order_id'], self.order.order_id)

    def test_retrieve_user_order_with_invalid_permissions(self):
        other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='client'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('user-order-detail', args=[self.order.order_id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)  
        self.assertIn('No Order matches the given query.', str(response.data))  
        
#ArchivedOrder
class ArchivedUserOrderListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery',
            archived=True
        )

    def test_retrieve_archived_user_orders_with_orders(self):
        url = reverse('archived-user-orders')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['order_id'], self.order.order_id)

    def test_retrieve_archived_user_orders_with_no_orders(self):
        self.order.delete()
        url = reverse('archived-user-orders')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
class ArchivedRestaurantOrdersViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery',
            archived=True
        )

    def test_retrieve_archived_restaurant_orders_with_orders(self):
        url = reverse('archived-restaurant-orders', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['order_id'], self.order.order_id)

    def test_retrieve_archived_restaurant_orders_with_no_orders(self):
        self.order.delete()
        url = reverse('archived-restaurant-orders', args=[self.restaurant.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

#Stripe
class CreateCheckoutSessionViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    @patch('stripe.checkout.Session.create')
    def test_create_checkout_session(self, mock_stripe_session_create):
        mock_stripe_session_create.return_value.id = 'test_session_id'
        
        url = reverse('create-checkout-session')
        data = {
            'email': self.user.email,
            'orderId': self.order.order_id,
            'restaurant': self.restaurant.name,
            'totalAmount': '19.98'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertEqual(response.data['id'], 'test_session_id')
        mock_stripe_session_create.assert_called_once_with(
            customer_email=self.user.email,
            payment_method_types=['card', 'blik', 'p24'],
            line_items=[{
                'price_data': {
                    'currency': 'pln',
                    'product_data': {'name': f'{self.restaurant.name} - zamówienie nr. {self.order.order_id}'},
                    'unit_amount': 1998,  # Kwota w groszach, 1000 to 10 PLN
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'http://localhost:8000/api/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={self.order.order_id}',
            cancel_url=f'http://localhost:3000/user/orders/{self.order.order_id}?payment=fail',
            metadata={'order_id': self.order.order_id},
        )

class SuccessPaymentViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Description',
            price=Decimal('9.99'),
            restaurant=self.restaurant,
            is_available=True
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )

    @patch('core.views.get_channel_layer')
    @patch('core.views.async_to_sync')
    def test_success_payment(self, mock_async_to_sync, mock_get_channel_layer):
        url = reverse('success')
        data = {
            'session_id': 'test_session_id',
            'order_id': self.order.order_id
        }
        response = self.client.get(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertEqual(response.url, f'http://localhost:3000/user/orders/{self.order.order_id}?payment=success')
        
        self.order.refresh_from_db()
        self.assertTrue(self.order.is_paid)

#Chat
class ChatMessageListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.room_name = 'test_room'
        self.message = ChatMessage.objects.create(
            room=self.room_name,
            user=self.user,
            message='Test message'
        )

    def test_retrieve_chat_messages_with_messages(self):
        url = reverse('chat-messages', args=[self.room_name])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message'], self.message.message)

    def test_retrieve_chat_messages_with_no_messages(self):
        ChatMessage.objects.all().delete()
        url = reverse('chat-messages', args=[self.room_name])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
#Notification
class UnreadNotificationsListViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )
        Notification.objects.all().delete()  # Clear all notifications before each test
        self.notification = Notification.objects.create(
            user=self.user,
            order=self.order,
            message='Test notification',
            is_read=False
        )

    def test_retrieve_unread_notifications_with_notifications(self):
        url = reverse('unread-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message'], self.notification.message)

    def test_retrieve_unread_notifications_with_no_notifications(self):
        self.notification.is_read = True
        self.notification.save()
        url = reverse('unread-notifications')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
        
class MarkNotificationAsReadViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )
        Notification.objects.all().delete()  # Clear all notifications before each test
        self.notification = Notification.objects.create(
            user=self.user,
            order=self.order,
            message='Test notification',
            is_read=False
        )

    def test_mark_notification_as_read_with_valid_permissions(self):
        url = reverse('mark-notification-as-read', args=[self.notification.id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification.refresh_from_db()
        self.assertTrue(self.notification.is_read)

    def test_mark_notification_as_read_with_invalid_permissions(self):
        other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='client'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('mark-notification-as-read', args=[self.notification.id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
class MarkNotificationsAsReadByOrderViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = AppUser.objects.create_user(
            email='user@example.com',
            password='testpass',
            first_name='User',
            last_name='Test',
            role='client'
        )
        self.client.force_authenticate(user=self.user)
        self.city = City.objects.create(name='Test City')
        self.address = Address.objects.create(
            user=self.user,
            street='Test Street',
            building_number=1,
            apartment_number=1,
            postal_code='00-000',
            city=self.city.name,
            phone_number='123456789'
        )
        self.restaurant = Restaurant.objects.create(
            owner=self.user,
            name='Test Restaurant',
            phone_number='123456789'
        )
        self.cart = Cart.objects.create(session_id='testsession123')
        self.order = Order.objects.create(
            user=self.user,
            restaurant=self.restaurant,
            address=self.address,
            cart=self.cart,
            payment_type='card',
            delivery_type='delivery'
        )
        Notification.objects.all().delete() 
        self.notification1 = Notification.objects.create(
            user=self.user,
            order=self.order,
            message='Test notification 1',
            is_read=False
        )
        self.notification2 = Notification.objects.create(
            user=self.user,
            order=self.order,
            message='Test notification 2',
            is_read=False
        )
        
    def test_mark_notifications_as_read_by_order_with_valid_permissions(self):
        url = reverse('mark-notifications-as-read-by-order', args=[self.order.order_id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notification1.refresh_from_db()
        self.notification2.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        self.assertTrue(self.notification2.is_read)

    def test_mark_notifications_as_read_by_order_with_invalid_permissions(self):
        other_user = AppUser.objects.create_user(
            email='otheruser@example.com',
            password='testpass',
            first_name='Other',
            last_name='User',
            role='client'
        )
        self.client.force_authenticate(user=other_user)
        url = reverse('mark-notifications-as-read-by-order', args=[self.order.order_id])
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)