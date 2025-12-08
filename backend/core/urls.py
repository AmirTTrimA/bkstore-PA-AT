from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # API Version 1 Router
    path(
        "api/v1/",
        include(
            [
                path("auth/", include("accounts.urls")),
                path('', include('catalog.urls')),
                path("pricing/", include("pricing.urls")),
            ]
        ),
    ),
]
