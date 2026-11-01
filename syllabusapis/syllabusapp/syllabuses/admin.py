from django.contrib import admin
from django.urls import path

from syllabuses.models import User, TypeAssessment, ScheduleGroup, TrainingProgram, TemplateBlock, CustomColumn, CustomColumnValue

class MyAdminSite(admin.AdminSite):
    site_header = 'Syllabus App'
admin_site = MyAdminSite()

admin_site.register(User)
admin_site.register(TypeAssessment)
admin_site.register(ScheduleGroup)
admin_site.register(TrainingProgram)
admin_site.register(TemplateBlock)
admin_site.register(CustomColumn)
admin_site.register(CustomColumnValue)