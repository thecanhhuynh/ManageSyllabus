import django_filters
from django.db.models import Q, Value, CharField
from django.db.models.functions import Concat

from syllabuses.models import Syllabus, Subject, LearningMaterial, User, Lecturer


class SyllabusFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(field_name='name', lookup_expr='icontains')

    class Meta:
        model = Syllabus
        fields = ['faculty', 'subject']

class LecturerFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method="custom_search")

    class Meta:
        model = Lecturer
        fields = ['q']

    def custom_search(self, queryset, name, value):

        return queryset.annotate(
            full_name=Concat("user__last_name", Value(" "), "user__first_name", output_field=CharField())
        ).filter(
            Q(full_name__icontains=value) |
            Q(user__first_name__icontains=value) |
            Q(user__last_name__icontains=value) |
            Q(user__username__icontains=value) |
            Q(user__email__icontains=value)
        )

class UserFilter(django_filters.FilterSet):
    q = django_filters.CharFilter(method='custom_search')

    class Meta:
        model = User
        fields = ['q']

    def custom_search(self, queryset, name, value):
        return queryset.annotate(
            full_name=Concat("first_name", Value(" "), "last_name")
        ).filter(
            Q(full_name__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(username__icontains=value) |
            Q(email__icontains=value)
        )


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
