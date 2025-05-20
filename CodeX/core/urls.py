from django.contrib import admin
from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('login/', views.login_page, name='login_page'),
    
    # Registration URL
    path('register/', views.register, name='register'),
    
    # Dashboard and Code URLs
    path('dashboard/', views.dashboard, name='dashboard'),
    path('create-code/', views.create_code, name='create_code'),
    path('code/<int:pk>/', views.code_detail, name='code_detail'),
    path('delete-code/<int:pk>/', views.delete_code, name='delete_code'),
    path('shared-code/<int:pk>/', views.shared_code, name='shared_code'),
    path('logout/', views.logout_view, name='logout_view'),
    
    # AI Chat API
    path('api/chat/', views.chat_api, name='chat_api'),
]
