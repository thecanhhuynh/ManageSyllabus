from rest_framework.pagination import PageNumberPagination


class UserPaginator(PageNumberPagination):
    page_size = 10

class SyllabusPagination(PageNumberPagination):
    page_size = 10

class FacultyPagination(PageNumberPagination):
    page_size = 10

class SubjectsPagination(PageNumberPagination):
    page_size = 10