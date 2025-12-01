from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Equipo
from .serializers import EquipoSerializer, EquipoWriteSerializer

User = get_user_model()


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_entrenador(user):
    return getattr(user, 'role', None) == 'entrenador'


class EquipoViewSet(viewsets.ModelViewSet):
    queryset = Equipo.objects.all()
    serializer_class = EquipoSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return EquipoWriteSerializer
        return EquipoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        division = self.request.query_params.get('division')
        nivel = self.request.query_params.get('nivel')
        categoria = self.request.query_params.get('categoria')
        if division:
            qs = qs.filter(division=division)
        if nivel:
            qs = qs.filter(nivel=nivel)
        if categoria:
            qs = qs.filter(categoria=categoria)
        return qs

    @action(detail=True, methods=['get'], url_path='atletas')
    def atletas(self, request, pk=None):
        from atletas.models import Atleta
        equipo = self.get_object()
        atletas = Atleta.objects.filter(equipo=equipo)
        data = [
            {
                'id': a.id,
                'nombres': a.nombres,
                'apellidos': a.apellidos,
                'rut': a.rut,
                'division': a.division,
                'categoria': a.categoria,
                'nivel': a.nivel,
                'apoderado': a.apoderado.id if a.apoderado else None,
                'apoderado_email': a.apoderado.email if a.apoderado else None,
            }
            for a in atletas
        ]
        return Response(data)

    @action(detail=True, methods=['get'], url_path='horarios')
    def horarios(self, request, pk=None):
        from horarios.models import Horario
        equipo = self.get_object()
        horarios = Horario.objects.filter(equipo=equipo)
        data = [
            {
                'id': h.id,
                'dia_semana': h.dia_semana,
                'hora_inicio': h.hora_inicio,
                'hora_termino': h.hora_termino,
                'lugar': h.lugar,
                'color': h.color,
            }
            for h in horarios
        ]
        return Response(data)
