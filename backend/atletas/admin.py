from django.contrib import admin
from .models import Atleta, CertificacionAtleta

@admin.register(Atleta)
class AtletaAdmin(admin.ModelAdmin):
    list_display = ('nombres', 'apellidos', 'rut', 'division', 'categoria', 'nivel', 'activo')
    search_fields = ('nombres', 'apellidos', 'rut')
    list_filter = ('division', 'categoria', 'nivel', 'activo')


@admin.register(CertificacionAtleta)
class CertificacionAtletaAdmin(admin.ModelAdmin):
    list_display = ('atleta', 'tipo', 'nombre', 'fecha_emision')
    list_filter = ('tipo',)
