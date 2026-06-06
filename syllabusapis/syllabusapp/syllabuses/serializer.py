from rest_framework import serializers

from syllabuses.models import User, Lecturer, Faculty, Syllabus


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['name']

class LecturerSerializer(serializers.ModelSerializer):
    faculty = FacultySerializer()
    class Meta:
        model = Lecturer
        fields = ['room', 'faculty']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'password', 'avatar', 'email', 'user_role']
        extra_kwargs = {
            'password': {
                'write_only': True,
            }
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data['password'])
        user.user_role = User.UserRole.USER
        user.save()

        Lecturer.objects.create(user=user)
        return user

class UserDetailSerializer(UserSerializer):
    lecturer = LecturerSerializer(source='lecturer_profile', read_only=True)

    room = serializers.CharField(write_only=True, required=False)
    faculty = serializers.CharField(write_only=True, required=False)

    class Meta(UserSerializer.Meta):
        fields = [f for f in UserSerializer.Meta.fields if f != 'password'] + ['lecturer', 'room', 'faculty']

    def update(self, instance, validated_data):
        room = validated_data.pop('room', None)
        faculty_name = validated_data.pop('faculty', None)
        instance = super().update(instance, validated_data)

        if hasattr(instance, 'lecturer_profile'):
            if room is not None:
                instance.lecturer_profile.room = room
            if faculty_name is not None:
                faculty_obj, _ = Faculty.objects.get_or_create(name=faculty_name)
                instance.lecturer_profile.faculty = faculty_obj
                instance.lecturer_profile.save()
            instance.lecturer_profile.save()
        return instance

class SyllabusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Syllabus
        fields = ['id', 'title', 'syllabus']

