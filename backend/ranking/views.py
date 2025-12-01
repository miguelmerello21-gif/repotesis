from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RankingAtleta, LogroAtleta, EvaluacionAtleta
from .serializers import RankingAtletaSerializer, LogroAtletaSerializer, EvaluacionAtletaSerializer
from users.permissions import IsRoleAdmin


class RankingViewSet(viewsets.ModelViewSet):
    queryset = RankingAtleta.objects.select_related('atleta', 'atleta__equipo')
    serializer_class = RankingAtletaSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsRoleAdmin()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        atleta_id = params.get('atleta')
        equipo_id = params.get('equipo')
        division = params.get('division')
        categoria = params.get('categoria')
        nivel = params.get('nivel')

        if atleta_id:
            qs = qs.filter(atleta_id=atleta_id)
        if equipo_id:
            qs = qs.filter(atleta__equipo_id=equipo_id)
        if division:
            qs = qs.filter(atleta__division=division)
        if categoria:
            qs = qs.filter(atleta__categoria=categoria)
        if nivel:
            qs = qs.filter(atleta__nivel=nivel)
        return qs

    @action(detail=False, methods=['get'], url_path='atleta/(?P<atleta_id>[^/.]+)')
    def ranking_atleta(self, request, atleta_id=None):
        try:
            ranking = RankingAtleta.objects.get(atleta_id=atleta_id)
        except RankingAtleta.DoesNotExist:
            return Response(status=404)
        serializer = self.get_serializer(ranking)
        return Response(serializer.data)


class LogroAtletaViewSet(viewsets.ModelViewSet):
    queryset = LogroAtleta.objects.select_related('atleta')
    serializer_class = LogroAtletaSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        atleta = self.request.query_params.get('atleta')
        if atleta:
            qs = qs.filter(atleta_id=atleta)
        return qs


class EvaluacionAtletaViewSet(viewsets.ModelViewSet):
    queryset = EvaluacionAtleta.objects.select_related('atleta', 'evaluador')
    serializer_class = EvaluacionAtletaSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = super().get_queryset()
        atleta = self.request.query_params.get('atleta')
        if atleta:
            qs = qs.filter(atleta_id=atleta)
        return qs
