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
    path('api/user/details/', UserDetailsView.as_view(), name='user-details'),
    
    #Address
    path('api/addresses/', AddressListView.as_view(), name='address_list'),
    path('api/add-address/', AddAddressView.as_view(), name='add_address'),
    path('api/delete-address/<int:pk>/', DeleteAddressView.as_view(), name='delete_address'),
    
    #Restaurant
    path('api/restaurant/register/', RestaurantRegistrationView.as_view(), name='register_restaurateur'),
    path('api/restaurant/list', RestaurantListView.as_view(), name='restaurant-list'),
    path('api/restaurant/user', RestaurantProfileView.as_view(), name='restaurant_user'),
    path('api/restaurant/update/<int:pk>/', RestaurantUpdateView.as_view(), name='restaurant-detail'),
    
    path('api/cities/', CityListView.as_view(), name='city-list'),
    
    #DeliveryCity
    path('api/restaurant/<int:restaurant_id>/add-delivery-city/', AddDeliveryCityView.as_view(), name='add-delivery-city'),
    path('api/restaurant/<int:restaurant_id>/remove-delivery-city/', RemoveDeliveryCityView.as_view(), name='remove-delivery-city'),
    
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
    path('api/restaurant/<int:restaurant_id>/all-products/', AllProductListView.as_view(), name='product-list'),
    path('api/restaurant/delete-product/<int:pk>/', ProductDeleteView.as_view(), name='product-delete'),
    path('api/restaurant/update-product/<int:pk>/', ProductUpdateView.as_view(), name='update-product'),
    path('api/restaurant/product/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    
    #Cart
    path('api/cart/<str:session_id>/', CartListCreateView.as_view(), name='cart-detail'),
    path('api/cart/<str:session_id>/items/', CartItemListCreateView.as_view(), name='cartitem-list-create'),
    path('api/cart/<str:session_id>/items/<int:pk>/', CartItemRetrieveUpdateDestroyView.as_view(), name='cartitem-detail'),
    path('api/cart/<str:session_id>/clear/<int:restaurant_id>/', ClearCartItemsFromOtherRestaurantsView.as_view(), name='clear-cart-items'),
    path('api/cart/<int:cart_id>/restaurant-info/', CartRestaurantInfoView.as_view(), name='cart-restaurant-info'),
    
    #Order
    path('api/orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('api/orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('api/user/orders/', UserOrderListView.as_view(), name='user-order-list'),
    path('api/restaurant/<int:restaurant_id>/orders/', RestaurantOrdersView.as_view(), name='restaurant-orders'),
    path('api/user/orders/<int:pk>/', UserOrderDetailView.as_view(), name='user-order-detail'),
    
    #Archived Order
    path('api/user/archived-orders/', ArchivedUserOrderListView.as_view(), name='archived-user-orders'),
    path('api/restaurant/<int:restaurant_id>/archived-orders/', ArchivedRestaurantOrdersView.as_view(), name='archived-restaurant-orders'),
    
    #Payment
    path('api/create-checkout-session/', CreateCheckoutSessionView.as_view(), name='create-checkout-session'),
    path('api/success/', SuccessPaymentView.as_view(), name='success'),
    
    #Chat
    path('api/chat/<str:room_name>/messages/', ChatMessageListView.as_view(), name='chat-messages'),
    
    #Notifications
    path('api/notifications/unread/', UnreadNotificationsListView.as_view(), name='unread-notifications'),
    path('api/notifications/<int:id>/mark_as_read/', MarkNotificationAsReadView.as_view(), name='mark-notification-as-read'),
    path('api/notifications/mark_as_read_by_order/<int:order_id>/', MarkNotificationsAsReadByOrderView.as_view(), name='mark-notifications-as-read-by-order'),
]

from django.conf.urls.static import static
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)