from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Notificacion
from .serializers import NotificacionSerializer


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_entrenador(user):
    return getattr(user, 'role', None) == 'entrenador'


class NotificacionViewSet(viewsets.ModelViewSet):
    serializer_class = NotificacionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Notificacion.objects.all()
        if is_admin(user):
            return qs
        if is_entrenador(user):
            return qs.filter(creado_por=user)
        return qs.filter(destinatarios=user)

    def perform_create(self, serializer):
        if not (is_admin(self.request.user) or is_entrenador(self.request.user)):
            raise PermissionDenied()
        serializer.save(creado_por=self.request.user)

    @action(detail=True, methods=['patch'], url_path='marcar-leida')
    def marcar_leida(self, request, pk=None):
        noti = self.get_object()
        noti.leida_por.add(request.user)
        return Response({'detail': 'Notificación marcada como leída'})

    @action(detail=False, methods=['get'], url_path='no-leidas/count')
    def no_leidas_count(self, request):
        count = Notificacion.objects.filter(destinatarios=request.user).exclude(leida_por=request.user).count()
        return Response({'count': count})
