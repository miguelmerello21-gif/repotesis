from django.contrib import admin
from .models import Equipo

@admin.register(Equipo)
class EquipoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'division', 'categoria', 'nivel', 'activo')
    search_fields = ('nombre', 'division', 'categoria')
    list_filter = ('division', 'categoria', 'nivel', 'activo')
