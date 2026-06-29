from django.contrib import admin
from django.urls import path

from syllabuses.models import User, TypeAssessment, ScheduleGroup, TrainingProgram


# Register your models here.



class MyAdminSite(admin.AdminSite):
    site_header = 'Syllabus App'
    # def get_urls(self):
    #     return [path('stats-view/', self.stats_view)] + super().get_urls()

    # def stats_view(self, request):
    #     # stats = Category.objects.annotate(count=Count('course')).values('id', 'name', 'count')
    #
    #     return TemplateResponse(request, 'admin/stats.html', {'stats': stats})

admin_site = MyAdminSite()

admin_site.register(User)
admin_site.register(TypeAssessment)
admin_site.register(ScheduleGroup)
admin_site.register(TrainingProgram)