from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import DatosLanding, FotoCarrusel, EventoLanding
from .serializers import DatosLandingSerializer, FotoCarruselSerializer, EventoLandingSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


def is_admin(user):
    return (
        getattr(user, 'is_superuser', False)
        or getattr(user, 'is_staff', False)
        or getattr(user, 'role', None) == 'admin'
    )


class DatosLandingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        obj = DatosLanding.load()
        serializer = DatosLandingSerializer(obj)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        if not is_admin(request.user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        obj = DatosLanding.load()
        serializer = DatosLandingSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(serializer.data)


class FotoCarruselViewSet(viewsets.ModelViewSet):
    serializer_class = FotoCarruselSerializer

    def get_queryset(self):
        qs = FotoCarrusel.objects.all()
        if is_admin(self.request.user):
            return qs
        return qs.filter(activa=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        serializer.save()

    def perform_update(self, serializer):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        return super().perform_destroy(instance)


class EventoLandingViewSet(viewsets.ModelViewSet):
    serializer_class = EventoLandingSerializer

    def get_queryset(self):
        qs = EventoLanding.objects.all()
        if is_admin(self.request.user):
            return qs
        return qs.filter(visible=True)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        serializer.save()

    def perform_update(self, serializer):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        serializer.save()

    def perform_destroy(self, instance):
        if not is_admin(self.request.user):
            raise permissions.PermissionDenied()
        return super().perform_destroy(instance)


class EntrenadoresLandingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        perfiles = User.objects.filter(role='entrenador')
        data = [
            {
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
            }
            for u in perfiles
        ]
        return Response(data)


class EstadisticasLandingViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        obj = DatosLanding.load()
        data = {
            'campeonatos': obj.total_competencias,
            'atletas': obj.total_atletas,
            'entrenadores': obj.total_entrenadores,
            'anios': obj.anos_experiencia,
        }
        return Response(data)
