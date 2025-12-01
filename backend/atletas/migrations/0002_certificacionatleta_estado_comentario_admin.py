from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('atletas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='certificacionatleta',
            name='comentario_admin',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='certificacionatleta',
            name='estado',
            field=models.CharField(choices=[('pendiente', 'Pendiente'), ('aprobada', 'Aprobada'), ('rechazada', 'Rechazada')], default='pendiente', max_length=20),
        ),
    ]
