from rest_framework import viewsets, permissions
from .models import Egreso
from .serializers import EgresoSerializer
from users.permissions import IsRoleAdmin


class EgresoViewSet(viewsets.ModelViewSet):
    queryset = Egreso.objects.all()
    serializer_class = EgresoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsRoleAdmin()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        categoria = self.request.query_params.get('categoria')
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs.order_by('-fecha', '-created_at')
