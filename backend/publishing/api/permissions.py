from publishing.models import PublisherMembership
from rest_framework.permissions import BasePermission


class IsPublisherMember(BasePermission):
    """
    Allows access only to active members of an active publisher.
    Staff and superusers are granted access for administration and moderation.
    """

    def has_permission(self, request, view):
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True

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
    Staff and superusers are granted access for administration and moderation.
    """

    def has_object_permission(self, request, view, obj):
        if request.user and (request.user.is_staff or request.user.is_superuser):
            return True

        return PublisherMembership.objects.filter(
            publisher=obj.publisher,
            user=request.user,
            is_active=True,
            publisher__is_active=True,
        ).exists()