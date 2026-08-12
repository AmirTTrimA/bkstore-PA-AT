from publishing.models import PublisherMembership
from rest_framework.permissions import BasePermission


class IsPublisherMember(BasePermission):
    """
    Allows access only to active members of an active publisher.
    """

    def has_permission(self, request, view):
        publisher_id = view.kwargs.get("publisher_id")

        return PublisherMembership.objects.filter(
            publisher_id=publisher_id,
            user=request.user,
            is_active=True,
            publisher__is_active=True,
        ).exists()


class IsProposalPublisherMember(BasePermission):
    """
    Allows access only to active members of the proposal's
    active publisher.
    """

    def has_object_permission(self, request, view, obj):
        return PublisherMembership.objects.filter(
            publisher=obj.publisher,
            user=request.user,
            is_active=True,
            publisher__is_active=True,
        ).exists()