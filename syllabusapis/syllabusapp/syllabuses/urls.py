from django.contrib import admin
from django.db import router
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from syllabuses import views

routes = DefaultRouter()
routes.register('users', views.UserView )
urlpatterns = [
    path('', include(routes.urls)),
]
