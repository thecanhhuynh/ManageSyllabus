from django.contrib import admin
from django.db import router
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from syllabuses import views
from syllabuses.views import ExportSyllabusDocxView, sse_sync_stream

routes = DefaultRouter()
routes.register('users', views.UserView, basename='users')
routes.register('admin/users', views.UserView, basename='admin-users')
routes.register('syllabuses', views.SyllabusView)
routes.register('faculties', views.FacultyView)
routes.register('subjects', views.SubjectView)
routes.register('attribute-groups', views.AttributeGroupView)
routes.register('type-requirements', views.TypeRequirementView)
routes.register('programme-learning-outcomes', views.ProgrammeLearningOutcomeView)
routes.register('learning-materials', views.LearningMaterialsView)
routes.register('type-learning-materials', views.TypeLearningMaterialsView)
routes.register('schedule-groups', views.ScheduleView)
routes.register('training-programs', views.TrainingProgramView)
routes.register('majors', views.MajorView)
routes.register('lecturers', views.LecturerView)
routes.register('templates', views.TemplateSyllabusView)

urlpatterns = [
    path('', include(routes.urls)),
    path('api/auth/register/', views.RegisterView.as_view(), name='api-auth-register'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('export-syllabus/<int:syllabus_id>/', ExportSyllabusDocxView.as_view(), name='export-syllabus-docx'),
    path('sse/sync-stream/', sse_sync_stream, name='sse_sync_stream'),
]
