from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("staffing", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="color",
            field=models.CharField(default="#3D7A6C", max_length=7),
        ),
    ]
