# Generated by Django 5.1.3 on 2025-01-07 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0016_restaurant_allows_cash_payment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='minimum_order_amount',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
    ]
