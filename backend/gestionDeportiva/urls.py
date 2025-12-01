from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('equipos.urls')),
    path('api/', include('atletas.urls')),
    path('api/', include('pagos.urls')),
    path('api/', include('horarios.urls')),
    path('api/', include('notificaciones.urls')),
    path('api/', include('ranking.urls')),
    path('api/', include('tienda.urls')),
    path('api/', include('landing.urls')),
    path('api/', include('finanzas.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

