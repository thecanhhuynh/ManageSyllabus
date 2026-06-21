import django_filters
from django.db.models import Q

from syllabuses.models import Syllabus, Subject, LearningMaterial


class SyllabusFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Syllabus
        fields = ['faculty', 'subject']

class SubjectFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method='custom_search')

    class Meta:
        model = Subject
        fields = ['q']

    def custom_search(self, queryset, name, value):
        return queryset.filter(
            Q(id__icontains=value) | Q(name__icontains=value)
        )

class LearningMaterialsFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(field_name='name', lookup_expr='icontains')
    class Meta:
        model = LearningMaterial
        fields = ['q']