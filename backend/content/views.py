from accounts.serializers import LicenseSerializer
from rest_framework import generics, permissions

from .models import License


class LicenseListView(generics.ListAPIView):
    """
    Returns the authenticated user's content licenses.

    Only licenses owned by the requesting user are returned.
    """

    serializer_class = LicenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            License.objects
            .filter(user=self.request.user)
            .select_related("book", "book_format")
        )
