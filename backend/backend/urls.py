"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from . import views
from core.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('test/', views.send_some_data), # Add this
    
    #User
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/register/', clientRegister, name='register'),
    path('api/user/', UserProfileView.as_view(), name='user-profile'),
    path('api/delete-user/', DeleteUserView.as_view(), name='delete-user'),
    
    #Adress
    path('api/addresses/', AddressListView.as_view(), name='address_list'),
    path('api/add-address/', AddAddressView.as_view(), name='add_address'),
    path('api/delete-address/<int:pk>/', DeleteAddressView.as_view(), name='delete_address'),
    
    #Restaurant
    path('api/restaurant/register/', RestaurantRegistrationView.as_view(), name='register_restaurateur'),
    path('api/restaurant/list', RestaurantListView.as_view(), name='restaurant-list'),
    path('api/restaurant/user', RestaurantProfileView.as_view(), name='restaurant_user'),
    path('api/restaurant/update/<int:pk>/', RestaurantUpdateView.as_view(), name='restaurant-detail'),
    
    #Cloudinary
    path('api/generate-signature/', generateUploadSignature, name='generate_upload_signature'),
    
    # Tag
    path('api/tags/', TagListView.as_view(), name='tag-list'),
    path('api/tag/add/', TagCreateView.as_view(), name='tag-add'),
    path('api/restaurant/<int:pk>/tags/list', RestaurantTagListView.as_view(), name='restaurant-tag-list'),
    path('api/restaurants/filter-by-tags/', FilterRestaurantsByTagsView.as_view(), name='filter-restaurants-by-tags'),
    path('api/restaurant/<int:pk>/tags/update', RestaurantTagUpdateView.as_view(), name='restaurant-tag-update'),
    
    #Product
    path('api/restaurant/add-product/', ProductCreateView.as_view(), name='add-product'),
    path('api/restaurant/<int:restaurant_id>/products/', ProductListView.as_view(), name='product-list'),
    path('api/restaurant/delete-product/<int:pk>/', ProductDeleteView.as_view(), name='product-delete'),
    path('api/restaurant/update-product/<int:pk>/', ProductUpdateView.as_view(), name='update-product'),
    path('api/restaurant/product/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    
    #Cart
    path('api/cart/<str:session_id>/', CartListCreateView.as_view(), name='cart-detail'),
    path('api/cart/<str:session_id>/items/', CartItemListCreateView.as_view(), name='cartitem-list-create'),
    path('api/cart/<str:session_id>/items/<int:pk>/', CartItemRetrieveDestroyView.as_view(), name='cartitem-detail'),
    
]
