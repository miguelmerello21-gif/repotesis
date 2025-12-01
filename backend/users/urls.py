from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    RegisterView,
    LogoutView,
    MeView,
    PasswordResetRequestView,
    PasswordResetValidateView,
    PasswordResetConfirmView,
    UserViewSet,
    RefreshView,
    CertificacionEntrenadorViewSet,
)

router = DefaultRouter()
router.register(r"usuarios", UserViewSet, basename="usuarios")
router.register(r"certificaciones-entrenador", CertificacionEntrenadorViewSet, basename="certificaciones-entrenador")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("auth/password/reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password/reset/validate/", PasswordResetValidateView.as_view(), name="password_reset_validate"),
    path("auth/password/reset/confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("", include(router.urls)),
]
