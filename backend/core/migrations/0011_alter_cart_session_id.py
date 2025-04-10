# Generated by Django 5.1.3 on 2024-12-18 03:55

import django.utils.crypto
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_cart_order_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cart',
            name='session_id',
            field=models.CharField(default=django.utils.crypto.get_random_string, max_length=100, null=True, unique=True),
        ),
    ]
