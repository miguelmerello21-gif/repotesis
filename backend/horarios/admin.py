from django.contrib import admin
from .models import Horario, Asistencia

@admin.register(Horario)
class HorarioAdmin(admin.ModelAdmin):
    list_display = ('equipo', 'dia_semana', 'hora_inicio', 'hora_termino', 'lugar', 'activo')
    list_filter = ('dia_semana', 'equipo', 'activo')


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = ('atleta', 'horario', 'fecha', 'presente', 'metodo')
    list_filter = ('fecha', 'presente', 'metodo')
    search_fields = ('atleta__nombres', 'atleta__apellidos')
