from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, CustomRole, PasswordReset, CertificacionEntrenador


class UserAdmin(BaseUserAdmin):
    ordering = ("email",)
    list_display = ("email", "name", "role", "is_staff", "is_active", "created_at")
    search_fields = ("email", "name", "rut")
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Información personal",
            {
                "fields": (
                    "name",
                    "phone",
                    "rut",
                    "direccion",
                    "fecha_nacimiento",
                    "ocupacion",
                    "emergency_contact",
                    "emergency_phone",
                )
            },
        ),
        (
            "Roles y permisos",
            {
                "fields": (
                    "role",
                    "custom_role",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Fechas", {"fields": ("last_login", "created_at", "updated_at")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "name", "password1", "password2", "role", "is_staff", "is_superuser", "is_active"),
            },
        ),
    )


admin.site.register(User, UserAdmin)
admin.site.register(CustomRole)
admin.site.register(PasswordReset)
@admin.register(CertificacionEntrenador)
class CertificacionEntrenadorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "entrenador", "estado", "fecha_obtencion", "fecha_vencimiento", "created_at")
    list_filter = ("estado", "fecha_obtencion", "fecha_vencimiento")
    search_fields = ("nombre", "institucion", "entrenador__name", "entrenador__email")
