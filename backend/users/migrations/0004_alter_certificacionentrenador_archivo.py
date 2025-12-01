from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_certificacionentrenador'),
    ]

    operations = [
        migrations.AlterField(
            model_name='certificacionentrenador',
            name='archivo',
            field=models.FileField(blank=True, null=True, upload_to='certificaciones/'),
        ),
    ]

