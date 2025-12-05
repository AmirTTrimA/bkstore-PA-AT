import os
from datetime import timedelta
from pathlib import Path

from django.utils.translation import gettext_lazy as _  # 🔑 NEW: Import for I18N
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DEBUG")  # 🔑 CHANGE: Ensure DEBUG is cast as bool

ALLOWED_HOSTS = ["*"]


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sites",  # Required by allauth
    # Third-party apps
    "rest_framework",
    # Authentication & Password Reset Dependencies
    "rest_framework.authtoken",  # Required for some dj-rest-auth features
    "rest_framework_simplejwt.token_blacklist",
    "allauth",
    "allauth.account",
    "dj_rest_auth",
    # Local apps
    "accounts",
    "catalog",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",  # For bilingual support
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "allauth.account.middleware.AccountMiddleware",  # 🔑 FIX: Required by django-allauth
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",  # 🔑 ADDED: Essential for DEBUG=True usage
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "sqlite": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    },
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", default="localhost"),
        "PORT": os.getenv("DB_PORT", default="5432"),
    },
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

# 🔑 I18N: Custom Languages and Locale Path
LANGUAGES = [
    ("en", _("English")),
    ("fa", _("Farsi")),
]
LOCALE_PATHS = [
    BASE_DIR / "locale",  # Path to find our custom .po files
]

LANGUAGE_CODE = "en"  # 🔑 CHANGE: Use short code for consistency
TIME_ZONE = "UTC"

USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = "static/"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom User Model Configuration
AUTH_USER_MODEL = "accounts.User"

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
}

# Simple JWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),  # Short life for security
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),  # Longer life for convenience
    "ROTATE_REFRESH_TOKENS": True,  # Enhances security by invalidating old refresh tokens
    "BLACKLIST_AFTER_ROTATION": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# -------------------------------------------------------------
# 🔑 NEW: EMAIL & DJ-REST-AUTH / ALLAUTH CONFIGURATION
# -------------------------------------------------------------

# 1. EMAIL CONFIGURATION (CRUCIAL for Password Reset/OTP)
# In development, prints emails to the console/terminal.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = "support@bookstore.com"


# 2. ALLAUTH DEPENDENCIES (Required by dj-rest-auth)
SITE_ID = (
    1  # Defines the site used for generating email links (e.g., http://127.0.0.1:8000/)
)

# 🔑 FIX: Deprecated settings replaced with modern counterparts to clear warnings

# Replaces ACCOUNT_AUTHENTICATION_METHOD and ACCOUNT_EMAIL_REQUIRED
ACCOUNT_LOGIN_METHODS = ["username", "email"]

# 🔑 FIX: Replaced deprecated ACCOUNT_LOGIN_ATTEMPTS_LIMIT with ACCOUNT_RATE_LIMITS
ACCOUNT_RATE_LIMITS = {
    "login_failed": "5/m",  # Allows 5 failed login attempts per minute per user/IP
}

# Explicitly states which fields are required during signup (uses custom user model fields)
ACCOUNT_SIGNUP_FIELDS = ["email", "username", "job_or_major", "hobbies_or_likings"]

ACCOUNT_EMAIL_VERIFICATION = "none"  # Set to 'mandatory' for production security

ACCOUNT_EMAIL_SUBJECT_PREFIX = "[Bookstore] "  # Custom email subject prefix


# 3. DJ-REST-AUTH JWT CONFIGURATION
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": True,  # 🔑 SECURITY: Prevents JavaScript (XSS) from accessing the cookie.
    "JWT_AUTH_COOKIE": "access_token",  # Name of the Access Token cookie
    "JWT_AUTH_REFRESH_COOKIE": "refresh_token",  # Name of the Refresh Token cookie
}
