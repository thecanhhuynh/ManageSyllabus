from rest_framework.pagination import PageNumberPagination


class UserPaginator(PageNumberPagination):
    page_size = 10

class SyllabusPagination(PageNumberPagination):
    page_size = 10

class FacultyPagination(PageNumberPagination):
    page_size = 10

class LecturerPagination(PageNumberPagination):
    page_size = 10

class SubjectsPagination(PageNumberPagination):
    page_size = 10

class LearningMaterialsPagination(PageNumberPagination):
    page_size = 10

class MajorPagination(PageNumberPagination):
    page_size = 10

class TrainingPagination(PageNumberPagination):
    page_size = 10

class ProgrammeLearningOutcomePagination(PageNumberPagination):
    page_size = 10