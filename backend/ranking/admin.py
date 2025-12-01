from django.contrib import admin
from .models import RankingAtleta, LogroAtleta, EvaluacionAtleta


@admin.register(RankingAtleta)
class RankingAtletaAdmin(admin.ModelAdmin):
    list_display = ('atleta', 'posicion', 'puntos_totales', 'ultima_actualizacion')
    search_fields = ('atleta__nombres', 'atleta__apellidos')


@admin.register(LogroAtleta)
class LogroAtletaAdmin(admin.ModelAdmin):
    list_display = ('atleta', 'titulo', 'puntos', 'tipo', 'fecha')
    list_filter = ('tipo',)
    search_fields = ('atleta__nombres', 'atleta__apellidos', 'titulo')


@admin.register(EvaluacionAtleta)
class EvaluacionAtletaAdmin(admin.ModelAdmin):
    list_display = ('atleta', 'categoria', 'puntuacion', 'evaluador', 'fecha')
    list_filter = ('categoria',)
    search_fields = ('atleta__nombres', 'atleta__apellidos', 'evaluador__name')
