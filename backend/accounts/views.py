from rest_framework import generics, status
from rest_framework.response import Response
from .serializers import UserRegistrationSerializer


class UserRegistrationView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    Maps to POST /api/v1/auth/register/
    """

    serializer_class = UserRegistrationSerializer
    permission_classes = ()  # Allow unauthenticated access

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Matches contract: simple success message
        return Response(
            {"detail": "User created successfully."}, status=status.HTTP_201_CREATED
        )
