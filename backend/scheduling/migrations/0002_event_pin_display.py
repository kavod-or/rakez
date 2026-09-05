from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("scheduling", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="pin_display",
            field=models.CharField(blank=True, max_length=6),
        ),
    ]
