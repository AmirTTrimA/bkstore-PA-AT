# core/urls.py
from django.contrib import admin
from django.urls import include, path

# Custom Admin Branding
admin.site.site_header = "PageNet Bookstore Administration"
admin.site.site_title = "PageNet Admin Portal"
admin.site.index_title = "Bookstore Management & Editorial Operations"

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),
    path("admin/", admin.site.urls),

    # API Version 1 Router
    path(
        "api/v1/",
        include(
            [
                path("auth/", include("accounts.urls")),
                path("", include("catalog.urls")),
                path("pricing/", include("pricing.urls")),
                path("cart/", include("cart.urls")),
                path("publishing/", include("publishing.api.urls")),
                path("wallet/", include("wallet.api.urls")),
                path("content/", include("content.urls")),
                path("payments/", include("payments.api.urls")),
                path("recommendations/", include("recommendations.urls")),
            ]
        ),
    ),
]
