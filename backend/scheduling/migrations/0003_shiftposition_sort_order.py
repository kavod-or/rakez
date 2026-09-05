from django.db import migrations, models


def set_shift_position_order(apps, schema_editor):
    ShiftPosition = apps.get_model('scheduling', 'ShiftPosition')
    shift_ids = ShiftPosition.objects.order_by().values_list('shift_id', flat=True).distinct()

    for shift_id in shift_ids:
        for index, shift_position in enumerate(
            ShiftPosition.objects.filter(shift_id=shift_id).order_by('position_id'),
            start=1,
        ):
            shift_position.sort_order = index
            shift_position.save(update_fields=['sort_order'])


class Migration(migrations.Migration):

    dependencies = [
        ('scheduling', '0002_event_pin_display'),
    ]

    operations = [
        migrations.AddField(
            model_name='shiftposition',
            name='sort_order',
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.RunPython(set_shift_position_order, migrations.RunPython.noop),
        migrations.AlterModelOptions(
            name='shiftposition',
            options={'ordering': ['shift', 'sort_order', 'position']},
        ),
    ]
