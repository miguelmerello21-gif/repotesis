from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('horarios', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='horario',
            name='fecha',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterModelOptions(
            name='horario',
            options={'ordering': ['fecha', 'dia_semana', 'hora_inicio']},
        ),
    ]

