from django.contrib import admin
from django.db import router
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from syllabuses import views

routes = DefaultRouter()
routes.register('users', views.UserView )
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
]
