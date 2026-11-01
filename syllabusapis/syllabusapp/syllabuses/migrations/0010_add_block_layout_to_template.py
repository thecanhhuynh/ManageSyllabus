import syllabuses.models
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('syllabuses', '0009_templatefield_delete_templatecontrolfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='templatesyllabus',
            name='block_layout',
            field=models.JSONField(blank=True, help_text='Lưu trữ named_styles và table_structures theo schema block_layout V2', null=True, verbose_name='Cấu hình Block Style (JSON)'),
        ),
        migrations.AddField(
            model_name='templatesyllabus',
            name='file_clean',
            field=models.FileField(blank=True, null=True, upload_to=syllabuses.models.template_clean_upload_path, verbose_name='File mẫu DOCX đã làm sạch (Chiến lược A)'),
        ),
        migrations.AddField(
            model_name='templatesyllabus',
            name='layout_published_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Thời điểm Publish Block Layout gần nhất'),
        ),
    ]
