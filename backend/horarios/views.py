from datetime import date
from django.db.models import Q
from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Horario, Asistencia
from equipos.models import Equipo
from atletas.models import Atleta
from .serializers import HorarioSerializer, AsistenciaSerializer


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_entrenador(user):
    return getattr(user, 'role', None) == 'entrenador'


def is_apoderado(user):
    return getattr(user, 'role', None) == 'apoderado'


class HorarioViewSet(viewsets.ModelViewSet):
    queryset = Horario.objects.select_related('equipo', 'entrenador')
    serializer_class = HorarioSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        equipo = self.request.query_params.get('equipo')
        dia = self.request.query_params.get('dia')
        fecha = self.request.query_params.get('fecha')
        if equipo:
            qs = qs.filter(equipo_id=equipo)
        if dia:
            qs = qs.filter(dia_semana=dia)
        if fecha:
            qs = qs.filter(fecha=fecha)
        if is_admin(user):
            return qs
        if is_entrenador(user):
            # Ver todos los horarios para detectar choques, pero solo podrá crear/editar los propios (validado abajo)
            return qs
        if is_apoderado(user):
            from atletas.models import Atleta
            atletas_ids = Atleta.objects.filter(apoderado=user).values_list('equipo_id', flat=True)
            return qs.filter(equipo_id__in=atletas_ids)
        return qs.none()

    def get_permissions(self):
        # Controlaremos permisos de creación/edición en los métodos, pero todos necesitan autenticación
        return [permissions.IsAuthenticated()]

    def _puede_modificar_equipo(self, user, equipo_id):
        if is_admin(user):
            return True
        if is_entrenador(user):
            if hasattr(equipo_id, "id"):
                equipo_id = equipo_id.id
            if equipo_id is None:
                return False
            return Equipo.objects.filter(id=equipo_id, entrenadores=user).exists()
        return False

    def _with_dia_semana(self, serializer):
        """Si viene fecha, asegura que dia_semana quede consistente."""
        fecha_val = self.request.data.get('fecha')
        if fecha_val:
            try:
                fecha_dt = date.fromisoformat(fecha_val)
                # weekday(): lunes=0 -> queremos domingo=0
                dia_semana = (fecha_dt.weekday() + 1) % 7
                serializer.save(dia_semana=dia_semana, fecha=fecha_dt)
                return
            except ValueError:
                pass
        serializer.save()

    def perform_create(self, serializer):
        user = self.request.user
        equipo_val = serializer.validated_data.get('equipo') or self.request.data.get('equipo')
        equipo_id = equipo_val.id if hasattr(equipo_val, "id") else equipo_val
        if not self._puede_modificar_equipo(user, equipo_id):
            raise permissions.PermissionDenied('No tienes permiso para crear horario en este equipo')

        extra = {}
        fecha_val = serializer.validated_data.get('fecha') or self.request.data.get('fecha')
        if fecha_val:
            try:
                fecha_dt = date.fromisoformat(str(fecha_val))
                extra['fecha'] = fecha_dt
                extra['dia_semana'] = (fecha_dt.weekday() + 1) % 7
            except ValueError:
                pass

        if is_entrenador(user):
            serializer.save(entrenador=user, **extra)
        else:
            serializer.save(**extra)

    def perform_update(self, serializer):
        user = self.request.user
        # Solo el entrenador creador (o admin) puede editar el horario
        instancia = serializer.instance or self.get_object()
        if is_entrenador(user) and getattr(instancia, "entrenador_id", None) != user.id:
            raise permissions.PermissionDenied('Solo puedes editar horarios creados por ti')

        equipo_val = serializer.validated_data.get('equipo') or self.request.data.get('equipo')
        equipo_id = equipo_val.id if hasattr(equipo_val, "id") else equipo_val
        if not self._puede_modificar_equipo(user, equipo_id):
            raise permissions.PermissionDenied('No tienes permiso para actualizar horario en este equipo')
        extra = {}
        fecha_val = serializer.validated_data.get('fecha') or self.request.data.get('fecha')
        if fecha_val:
            try:
                fecha_dt = date.fromisoformat(str(fecha_val))
                extra['fecha'] = fecha_dt
                extra['dia_semana'] = (fecha_dt.weekday() + 1) % 7
            except ValueError:
                pass

        if is_entrenador(user):
            serializer.save(entrenador=user, **extra)
        else:
            serializer.save(**extra)

    def destroy(self, request, *args, **kwargs):
        horario = self.get_object()
        user = request.user
        if is_entrenador(user) and getattr(horario, "entrenador_id", None) != user.id and not is_admin(user):
            return Response(status=status.HTTP_403_FORBIDDEN)
        if not self._puede_modificar_equipo(user, horario.equipo_id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='mis-horarios')
    def mis_horarios(self, request):
        horarios = self.get_queryset()
        serializer = self.get_serializer(horarios, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get', 'post'], url_path='asistencias')
    def asistencias(self, request, pk=None):
        horario = self.get_object()
        if request.method.lower() == 'get':
            data = AsistenciaSerializer(horario.asistencias.all(), many=True).data
            return Response(data)
        # POST (entrenador/admin)
        if not (is_entrenador(request.user) or is_admin(request.user)):
            return Response(status=status.HTTP_403_FORBIDDEN)
        # Inyectamos el horario en el serializer para evitar error de campo requerido
        payload = request.data.copy()
        payload['horario'] = horario.id
        atleta_id = payload.get('atleta') or payload.get('atleta_id')
        fecha_val = payload.get('fecha')
        # Si ya existe asistencia para ese atleta/fecha, actualizamos en vez de duplicar
        if atleta_id and fecha_val:
          existente = Asistencia.objects.filter(horario=horario, atleta_id=atleta_id, fecha=fecha_val).first()
        else:
          existente = None
        if existente:
            prev_presente = existente.presente
            serializer = AsistenciaSerializer(existente, data=payload, partial=True, context={'horario': horario})
            serializer.is_valid(raise_exception=True)
            asistencia = serializer.save(registrado_por=request.user)
            # Incrementar asistencia solo si pasó de no presente a presente
            if asistencia.presente and not prev_presente:
                try:
                    atleta = asistencia.atleta
                    incremento = Decimal('3.0')
                    nuevo_valor = (Decimal(atleta.asistencia or 0) + incremento).quantize(Decimal('0.01'))
                    if nuevo_valor > Decimal('100'):
                        nuevo_valor = Decimal('100')
                    atleta.asistencia = nuevo_valor
                    atleta.save(update_fields=['asistencia'])
                except Exception:
                    pass
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = AsistenciaSerializer(data=payload, context={'horario': horario})
        serializer.is_valid(raise_exception=True)
        serializer.save(horario=horario, registrado_por=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



class AsistenciaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Asistencia.objects.select_related('atleta', 'horario', 'horario__equipo')
    serializer_class = AsistenciaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        atleta = self.request.query_params.get('atleta') or self.request.query_params.get('atleta_id')
        horario = self.request.query_params.get('horario')
        equipo = self.request.query_params.get('equipo')
        desde = self.request.query_params.get('desde')
        hasta = self.request.query_params.get('hasta')
        if atleta:
            qs = qs.filter(atleta_id=atleta)
        if horario:
            qs = qs.filter(horario_id=horario)
        if equipo:
            qs = qs.filter(horario__equipo_id=equipo)
        if desde:
            qs = qs.filter(fecha__gte=desde)
        if hasta:
            qs = qs.filter(fecha__lte=hasta)

        if is_admin(user) or is_entrenador(user):
            return qs
        if is_apoderado(user):
            atleta_ids = Atleta.objects.filter(apoderado=user).values_list('id', flat=True)
            return qs.filter(atleta_id__in=atleta_ids)
        return qs.none()

class AsistenciaPorAtletaViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, atleta_pk=None):
        asistencias = Asistencia.objects.filter(atleta_id=atleta_pk)
        serializer = AsistenciaSerializer(asistencias, many=True)
        return Response(serializer.data)