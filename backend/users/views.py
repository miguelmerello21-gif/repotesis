from datetime import timedelta
import secrets
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import PasswordReset, CertificacionEntrenador
from .permissions import IsRoleAdmin
from .serializers import CertificacionEntrenadorSerializer, RegisterSerializer, UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)
logger = logging.getLogger(__name__)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        return {
            "access": data["access"],
            "refresh": data["refresh"],
            "user": user_data,
        }


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token requerido"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response({"detail": "Token inválido"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": "Logout exitoso"})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response({"detail": "Email requerido"}, status=status.HTTP_400_BAD_REQUEST)
        short_code = secrets.token_hex(3).upper()
        PasswordReset.objects.create(
            email=email,
            code=short_code,
            expires_at=timezone.now() + timedelta(hours=1),
        )
        # Enviamos el código sólo si el correo existe; destinatario fijo a la cuenta institucional
        try:
            user_exists = User.objects.filter(email=email).exists()
            if user_exists:
                send_mail(
                    subject="Recuperación de contraseña",
                    message=(
                        f"Tu código para recuperar la contraseña es: {short_code}. "
                        "Si no solicitaste este cambio, puedes ignorar este mensaje."
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=["centrodeportivo.tesis@gmail.com"],
                )
        except Exception:
            # Silencioso para no revelar existencia del correo
            logger.exception("Error enviando codigo de recuperacion para %s", email)
        # Respuesta genérica (no exponemos el código)
        return Response({"detail": "Si el correo existe, se ha enviado un código de recuperación."})


class PasswordResetValidateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        if not email or not code:
            return Response({"detail": "Datos incompletos"}, status=status.HTTP_400_BAD_REQUEST)

        reset_obj = (
            PasswordReset.objects.filter(email=email, code=code, used=False)
            .order_by("-created_at")
            .first()
        )
        if not reset_obj or not reset_obj.is_valid():
            return Response(
                {"detail": "El código de recuperación es incorrecto o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({"detail": "Código válido, ingresa tu nueva contraseña."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")
        if not all([email, code, new_password]):
            return Response({"detail": "Datos incompletos"}, status=status.HTTP_400_BAD_REQUEST)

        reset_qs = PasswordReset.objects.filter(email=email, code=code, used=False).order_by("-created_at")
        reset_obj = reset_qs.first()
        if not reset_obj or not reset_obj.is_valid():
            return Response(
                {"detail": "El código de recuperación es incorrecto o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "El código de recuperación es incorrecto o ha expirado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        reset_obj.used = True
        reset_obj.save(update_fields=["used"])
        return Response({"detail": "La contraseña ha sido actualizada correctamente."})


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("-created_at")
    serializer_class = UserSerializer
    permission_classes = [IsRoleAdmin]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    @action(detail=True, methods=["patch"], url_path="cambiar-rol")
    def cambiar_rol(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get("role")
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if new_role not in valid_roles:
            return Response({"detail": "Rol inválido"}, status=status.HTTP_400_BAD_REQUEST)
        user.role = new_role
        user.save(update_fields=["role"])
        return Response(self.get_serializer(user).data)


class RefreshView(TokenRefreshView):
    pass


def is_admin(user):
    return (
        getattr(user, "role", None) in ("admin", "Administrador", "administrador")
        or getattr(user, "is_staff", False)
        or getattr(user, "is_superuser", False)
    )


class CertificacionEntrenadorViewSet(viewsets.ModelViewSet):
    queryset = CertificacionEntrenador.objects.select_related("entrenador").all()
    serializer_class = CertificacionEntrenadorSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "patch"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_admin(user):
            return qs
        if getattr(user, "role", "") == "entrenador":
            return qs.filter(entrenador=user)
        return qs.none()

    def create(self, request, *args, **kwargs):
        user = request.user
        if not (is_admin(user) or getattr(user, "role", "") == "entrenador"):
            return Response(status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        entrenador_obj = user
        provided_entrenador = data.get("entrenador") or data.get("entrenador_id")
        if provided_entrenador and is_admin(user):
            try:
                entrenador_obj = User.objects.get(pk=provided_entrenador)
            except User.DoesNotExist:
                return Response({"detail": "Entrenador no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        data["entrenador"] = entrenador_obj.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        entrenador_obj = None
        entrenador_id = self.request.data.get("entrenador") or self.request.data.get("entrenador_id")
        user = self.request.user
        if entrenador_id and is_admin(user):
            try:
                entrenador_obj = User.objects.get(pk=entrenador_id)
            except User.DoesNotExist:
                entrenador_obj = user
        else:
            entrenador_obj = user
        serializer.save(entrenador=entrenador_obj)

    def partial_update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        if not (is_admin(request.user) or obj.entrenador_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)