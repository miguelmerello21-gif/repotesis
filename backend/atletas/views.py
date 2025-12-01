from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Atleta, CertificacionAtleta
from .serializers import AtletaSerializer, FichaAtletaSerializer, CertificacionAtletaSerializer


def is_admin(user):
    return getattr(user, 'role', None) == 'admin'


def is_entrenador(user):
    return getattr(user, 'role', None) == 'entrenador'


def is_apoderado(user):
    return getattr(user, 'role', None) == 'apoderado'


class AtletaViewSet(viewsets.ModelViewSet):
    queryset = Atleta.objects.all().select_related('apoderado', 'equipo')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'asignar_equipo']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['ficha']:
            return FichaAtletaSerializer
        return AtletaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        filters = {}
        equipo = self.request.query_params.get('equipo')
        division = self.request.query_params.get('division')
        nivel = self.request.query_params.get('nivel')
        if equipo:
            filters['equipo_id'] = equipo
        if division:
            filters['division'] = division
        if nivel:
            filters['nivel'] = nivel
        qs = qs.filter(**filters)
        if is_admin(user) or user.is_staff:
            return qs
        if is_entrenador(user):
            return qs.filter(equipo__entrenadores=user)
        if is_apoderado(user):
            return qs.filter(apoderado=user)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        requested_apoderado = serializer.validated_data.get('apoderado')
        apoderado_final = requested_apoderado if (requested_apoderado and is_admin(user)) else user
        serializer.save(apoderado=apoderado_final)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'detail': 'Solo un administrador puede eliminar atletas directamente.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response(
                {'detail': 'La creación de atletas debe hacerse a través del flujo de matrícula.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().create(request, *args, **kwargs)

    def perform_update(self, serializer):
        user = self.request.user
        requested_apoderado = serializer.validated_data.get('apoderado')
        if requested_apoderado and not is_admin(user):
            serializer.validated_data.pop('apoderado', None)
            serializer.save()
            return
        if requested_apoderado and is_admin(user):
            serializer.save(apoderado=requested_apoderado)
            return
        serializer.save()

    @action(detail=False, methods=['get'], url_path='mis-atletas')
    def mis_atletas(self, request):
        qs = self.get_queryset().filter(apoderado=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-equipo/(?P<equipo_id>[^/.]+)')
    def por_equipo(self, request, equipo_id=None):
        from equipos.models import Equipo
        user = request.user
        try:
            equipo = Equipo.objects.get(pk=equipo_id)
        except Equipo.DoesNotExist:
            return Response({'detail': 'Equipo no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        if not (is_admin(user) or user.is_staff):
            if is_entrenador(user) and equipo.entrenadores.filter(pk=user.pk).exists():
                pass
            else:
                return Response({'detail': 'No autorizado para este equipo'}, status=status.HTTP_403_FORBIDDEN)

        qs = self.get_queryset().filter(equipo_id=equipo_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='ficha')
    def ficha(self, request, pk=None):
        atleta = self.get_object()
        serializer = FichaAtletaSerializer(atleta)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='asignar-equipo')
    def asignar_equipo(self, request, pk=None):
        atleta = self.get_object()
        equipo_id = request.data.get('equipo_id', request.data.get('equipo'))

        if equipo_id in [None, '', 'null', 'None']:
            atleta.equipo = None
            atleta.save(update_fields=['equipo'])
            return Response(self.get_serializer(atleta).data)

        from equipos.models import Equipo
        try:
            equipo = Equipo.objects.get(pk=equipo_id)
        except Equipo.DoesNotExist:
            return Response({'detail': 'Equipo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        atleta.equipo = equipo
        atleta.save(update_fields=['equipo'])
        return Response(self.get_serializer(atleta).data)

    @action(detail=True, methods=['get', 'post'], url_path='certificaciones')
    def certificaciones(self, request, pk=None):
        atleta = self.get_object()
        if request.method.lower() == 'get':
            serializer = CertificacionAtletaSerializer(
                atleta.certificaciones.all(), many=True, context={'request': request}
            )
            return Response(serializer.data)
        serializer = CertificacionAtletaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(atleta=atleta)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CertificacionAtletaViewSet(viewsets.ModelViewSet):
    queryset = CertificacionAtleta.objects.all()
    serializer_class = CertificacionAtletaSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'patch']

    def create(self, request, *args, **kwargs):
        atleta_id = request.data.get('atleta') or request.data.get('atleta_id')
        if not atleta_id:
            return Response({'detail': 'atleta requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            atleta = Atleta.objects.get(pk=atleta_id)
        except Atleta.DoesNotExist:
            return Response({'detail': 'Atleta no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        if not (is_admin(request.user) or atleta.apoderado_id == request.user.id):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user) and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if getattr(request.user, 'role', '') != 'admin' and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, 'role', '') == 'admin' or user.is_staff:
            return qs
        if is_entrenador(user):
            return qs.filter(atleta__equipo__entrenadores=user)
        return qs.filter(atleta__apoderado=user)

    @action(detail=False, methods=['get'], url_path='listar-todas')
    def listar_todas(self, request):
        user = request.user
        if not (getattr(user, 'role', '') == 'admin' or user.is_staff):
            return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='por-atleta/(?P<atleta_id>[^/.]+)')
    def por_atleta(self, request, atleta_id=None):
        """
        Lista certificaciones de un atleta, permitiendo acceso a admin,
        apoderado del atleta y entrenadores del equipo del atleta.
        """
        from equipos.models import Equipo
        user = request.user
        try:
            atleta = Atleta.objects.select_related('equipo', 'apoderado').get(pk=atleta_id)
        except Atleta.DoesNotExist:
            return Response({'detail': 'Atleta no encontrado'}, status=status.HTTP_404_NOT_FOUND)

        # admin siempre
        if not is_admin(user):
            # apoderado del atleta
            if atleta.apoderado_id == user.id:
                pass
            else:
                # entrenador asignado al equipo
                equipo = atleta.equipo
                if not (equipo and equipo.entrenadores.filter(pk=user.pk).exists()):
                    return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

        qs = CertificacionAtleta.objects.filter(atleta_id=atleta_id)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
