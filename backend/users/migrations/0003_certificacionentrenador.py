from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_role'),
    ]

    operations = [
        migrations.CreateModel(
            name='CertificacionEntrenador',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre', models.CharField(max_length=255)),
                ('institucion', models.CharField(max_length=255)),
                ('fecha_obtencion', models.DateField()),
                ('fecha_vencimiento', models.DateField(blank=True, null=True)),
                ('descripcion', models.TextField(blank=True)),
                ('archivo', models.CharField(blank=True, max_length=255)),
                ('estado', models.CharField(choices=[('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')], default='pendiente', max_length=20)),
                ('comentario_admin', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('entrenador', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='certificaciones', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Certificación de Entrenador',
                'verbose_name_plural': 'Certificaciones de Entrenador',
                'ordering': ['-created_at'],
            },
        ),
    ]

