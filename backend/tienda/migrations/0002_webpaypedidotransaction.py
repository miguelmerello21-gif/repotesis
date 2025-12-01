from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tienda', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='WebpayPedidoTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token', models.CharField(max_length=255, unique=True)),
                ('estado', models.CharField(choices=[('iniciada', 'Iniciada'), ('confirmada', 'Confirmada'), ('rechazada', 'Rechazada')], default='iniciada', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('pedido', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='webpay_transacciones', to='tienda.pedido')),
            ],
        ),
    ]
