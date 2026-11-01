from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('syllabuses', '0003_remove_courseobjective_subject_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subsection',
            name='requires_update',
            field=models.BooleanField(default=False),
        ),
    ]
