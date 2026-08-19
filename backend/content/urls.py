from django.urls import path

from .views import LicenseListView

urlpatterns = [
    path(
        "licenses/",
        LicenseListView.as_view(),
        name="license-list",
    ),
]
