# 🌐 Bookkadeh REST API Contract & Specification
### Production API Reference for Storefront, Publishing, Pricing, and Account Services

[![API Version](https://img.shields.io/badge/API_Version-v1.0-blue.svg?style=for-the-badge)](http://localhost:8000/api/v1/)
[![Base URL](https://img.shields.io/badge/Base_URL-/api/v1/-success.svg?style=for-the-badge)](http://localhost:8000/api/v1/)
[![Auth Type](https://img.shields.io/badge/Authentication-JWT_Bearer-orange.svg?style=for-the-badge)](http://localhost:8000/api/v1/auth/)
[![Data Format](https://img.shields.io/badge/Payload-JSON-yellow.svg?style=for-the-badge)](https://www.json.org/)

---

## 📑 Table of Contents

- [Global Conventions & Architecture](#-global-conventions--architecture)
  - [Base URLs & Versioning](#base-urls--versioning)
  - [Authentication & JWT Headers](#authentication--jwt-headers)
  - [Pagination Schema](#standard-pagination-schema)
  - [Standard Error Envelope](#standard-error-envelope)
- [1. Authentication & Identity Hub](#1-authentication--identity-hub-apiv1auth)
- [2. Catalog & Discovery](#2-catalog--discovery-apiv1)
- [3. Content-Based Recommendation Engine](#3-content-based-recommendation-engine-apiv1recommendations)
- [4. Pricing & VIP Subscriptions](#4-pricing--vip-subscriptions-apiv1pricing)
- [5. Publishing Operations & Proposals](#5-publishing-operations--proposals-apiv1publishing)
- [6. Cart, Orders & Wishlist](#6-cart-orders--wishlist-apiv1cart)
- [7. Digital Content & DRM Licenses](#7-digital-content--drm-licenses-apiv1content)
- [8. In-App Wallet & Financial Ledger](#8-in-app-wallet--financial-ledger-apiv1wallet)
- [9. Payments Gateway & Settlement](#9-payments-gateway--settlement-apiv1payments)

---

## 🏛️ Global Conventions & Architecture

### Base URLs & Versioning
All primary API endpoints are prefixed with the current version namespace:
```http
http://localhost:8000/api/v1/
```

### Authentication & JWT Headers
Endpoints requiring authentication enforce JSON Web Token (JWT) verification. Protected requests must include the token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```
Tokens are refreshed via `POST /api/v1/auth/refresh/` using a valid refresh token.

### Standard Pagination Schema
List endpoints utilize page-number pagination (`limit`/`page` query params) returning the standard pagination envelope:
```json
{
  "count": 128,
  "next": "http://localhost:8000/api/v1/books/?page=2",
  "previous": null,
  "results": []
}
```

### Standard Error Envelope
Error responses return consistent HTTP status codes paired with detailed validation structures:
```json
{
  "detail": "Descriptive error message explaining the failure condition."
}
```
Validation error format (HTTP `400 Bad Request`):
```json
{
  "field_name": [
    "This field is required.",
    "Ensure this value has at least 8 characters."
  ]
}
```

---

## 1. Authentication & Identity Hub (`/api/v1/auth/`)

The accounts module manages registration, traditional credential login, passwordless OTP email authentication, JWT rotation, user profile states, and multi-address management.

---

### `POST /api/v1/auth/register/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Registers a new user account with credentials.

#### Request
- **Headers:** `Content-Type: application/json`
- **Body Schema:**
  | Field | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `username` | string | Yes | Unique handle for the user. |
  | `email` | string | Yes | Valid email address. |
  | `password` | string | Yes | Complex password. |
  | `password2` | string | Yes | Password confirmation matching `password`. |

```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!"
}
```

#### Responses
- **`201 Created`**: User registered successfully.
  ```json
  {
    "username": "johndoe",
    "email": "johndoe@example.com"
  }
  ```
- **`400 Bad Request`**: Validation error (e.g. passwords do not match or username taken).

---

### `POST /api/v1/auth/login/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Authenticates via username and password, returning JWT access and refresh token pair.

#### Request
- **Body Schema:**
  | Field | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `username` | string | Yes | Account username or email. |
  | `password` | string | Yes | Account password. |

```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

#### Responses
- **`200 OK`**: Returns valid tokens.
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **`401 Unauthorized`**: Invalid username or password.

---

### `POST /api/v1/auth/login/otp/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Passwordless login using username/email and a 6-digit OTP code received via email.

#### Request
- **Body Schema:**
  | Field | Type | Required | Description |
  | :--- | :--- | :---: | :--- |
  | `username_or_email` | string | Yes | Account username or registered email. |
  | `code` | string | Yes | 6-digit verification code. |

```json
{
  "username_or_email": "johndoe@example.com",
  "code": "849201"
}
```

#### Responses
- **`200 OK`**: Returns JWT token pair.
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **`400 Bad Request`**: Invalid or expired code.

---

### `POST /api/v1/auth/refresh/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Refreshes an expired access token using a valid refresh token.

#### Request
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Responses
- **`200 OK`**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **`401 Unauthorized`**: Refresh token expired or blacklisted.

---

### `POST /api/v1/auth/logout/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Blacklists the refresh token to terminate session.

#### Request
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Responses
- **`200 OK`**:
  ```json
  {}
  ```

---

### `POST /api/v1/auth/otp/request/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Generates and dispatches a single-use 6-digit OTP code to the user's email (valid for 5 minutes).

#### Request
```json
{
  "username_or_email": "johndoe@example.com"
}
```

#### Responses
- **`200 OK`**:
  ```json
  {
    "detail": "OTP sent to your email address."
  }
  ```

---

### `POST /api/v1/auth/otp/verify/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Validates a one-time code for 2FA verification or re-authentication.

#### Request
```json
{
  "code": "849201"
}
```

#### Responses
- **`200 OK`**: Code successfully verified.
  ```json
  {
    "detail": "OTP code verified successfully."
  }
  ```

---

### `POST /api/v1/auth/password/reset/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Initiates password recovery by sending a reset link to the email address.

#### Request
```json
{
  "email": "johndoe@example.com"
}
```

#### Responses
- **`200 OK`**: Password reset e-mail has been sent.

---

### `POST /api/v1/auth/password/reset/confirm/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Finalizes password reset with token verification.

#### Request
```json
{
  "uidb64": "MQ",
  "token": "bq9y5c-60298a0f12c983d94b0f",
  "new_password": "NewSecurePassword123!",
  "new_password2": "NewSecurePassword123!"
}
```

#### Responses
- **`200 OK`**: Password has been reset with the new password.

---

### `POST /api/v1/auth/password/change/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Changes the password for the currently authenticated user.

#### Request
```json
{
  "current_password": "OldSecurePassword123!",
  "new_password": "NewSecurePassword123!"
}
```

#### Responses
- **`200 OK`**:
  ```json
  {
    "detail": "Password has been updated successfully."
  }
  ```

---

### `GET /api/v1/auth/profile/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Retrieves complete user profile hub including active subscription, licenses, orders, and addresses.

#### Responses
- **`200 OK`**:
  ```json
  {
    "id": 4,
    "username": "johndoe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "johndoe@example.com",
    "job_or_major": "Software Engineer",
    "hobbies_or_likings": "Sci-Fi, Philosophy, AI",
    "active_subscription": {
      "plan_name": "Gold Tier",
      "discount_percent": 30,
      "start_date": "2026-09-01T00:00:00Z",
      "end_date": "2026-10-01T00:00:00Z",
      "is_current": true
    },
    "licenses": [],
    "orders": [],
    "addresses": []
  }
  ```

---

### `PUT /api/v1/auth/profile/update/` & `PATCH /api/v1/auth/profile/update/`
![PATCH](https://img.shields.io/badge/PATCH-fd7e14?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Modifies editable profile attributes (username, personal info, preferences).

#### Request
```json
{
  "username": "johndoe",
  "first_name": "John",
  "last_name": "Doe",
  "job_or_major": "Senior Architect",
  "hobbies_or_likings": "Classical Literature, Science"
}
```

#### Responses
- **`200 OK`**: Profile updated successfully.

---

### `GET /api/v1/auth/addresses/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Lists all shipping addresses belonging to the authenticated user.

#### Responses
- **`200 OK`**: Array of address objects.
  ```json
  [
    {
      "id": 12,
      "title": "Home",
      "recipient_name": "John Doe",
      "phone_number": "09121234567",
      "country": "Iran",
      "province": "Tehran",
      "city": "Tehran",
      "address_line": "123 Vali-e Asr Ave, Apt 4B",
      "postal_code": "1983963111",
      "is_default": true,
      "created_at": "2026-08-15T10:00:00Z",
      "updated_at": "2026-08-15T10:00:00Z"
    }
  ]
  ```

---

### `POST /api/v1/auth/addresses/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Creates a new shipping address. Setting `is_default=true` unsets default status from previous addresses.

#### Request
```json
{
  "title": "Office",
  "recipient_name": "John Doe",
  "phone_number": "09121234567",
  "country": "Iran",
  "province": "Tehran",
  "city": "Tehran",
  "address_line": "No. 45 Motahari St, Unit 8",
  "postal_code": "1587574311",
  "is_default": false
}
```

#### Responses
- **`201 Created`**: Returns created address object with database `id`.

---

### `GET /api/v1/auth/addresses/<id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Retrieves a single shipping address owned by the user.

---

### `PUT /api/v1/auth/addresses/<id>/` & `PATCH /api/v1/auth/addresses/<id>/`
![PATCH](https://img.shields.io/badge/PATCH-fd7e14?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Replaces or partially updates fields on an existing shipping address.

---

### `DELETE /api/v1/auth/addresses/<id>/`
![DELETE](https://img.shields.io/badge/DELETE-dc3545?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Deletes an existing shipping address.

#### Responses
- **`204 No Content`**: Address deleted successfully.

---

## 2. Catalog & Discovery (`/api/v1/`)

The catalog subsystem powers book search, filtering, author profiles, and format representations. Every book item exposes dynamic pricing computed on-the-fly by the `PricingEngine`.

---

### `GET /api/v1/books/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Paginated book list with full-text search, multi-facet filtering, and dynamic pricing.

#### Query Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `search` | string | Full-text search over book title, description, and author name. |
| `genre` | string | Filter books by exact genre name (case-insensitive). |
| `author` | integer | Filter books by Author ID. |
| `publisher` | string/int | Filter books by Publisher ID or slug. |
| `format` | string | Filter by format type (`PRINT`, `EBOOK`, `AUDIO`). |
| `is_digital` | boolean | `true` or `false` filter for digital editions. |
| `is_audio` | boolean | `true` or `false` filter for audio editions. |
| `language` | string | Filter by ISO language code (`en`, `fa`). |
| `ordering` | string | Sort field (`title`, `-title`, `created_at`, `-created_at`). |
| `page` | integer | Page number for pagination. |

#### Responses
- **`200 OK`**:
  ```json
  {
    "count": 42,
    "next": "http://localhost:8000/api/v1/books/?page=2",
    "previous": null,
    "results": [
      {
        "id": 10,
        "title": "Clean Architecture",
        "author": {
          "id": 2,
          "name": "Robert C. Martin"
        },
        "genre": "Software Engineering",
        "language": "en",
        "cover_image_url": "https://cdn.bookkadeh.com/covers/clean_arch.jpg",
        "created_at": "2026-01-10T12:00:00Z",
        "formats": [
          {
            "id": 15,
            "format_type": "PRINT",
            "is_available": true,
            "base_price": "450000",
            "final_price": "315000",
            "discount_percentage": 30
          }
        ]
      }
    ]
  }
  ```

---

### `GET /api/v1/books/<id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Retrieves complete book details including synopsis, publisher attribution, and all format pricing.

#### Responses
- **`200 OK`**: Detailed book entity.
- **`404 Not Found`**: Book does not exist.

---

### `GET /api/v1/books/new/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Returns recently added catalog books ordered chronologically by release timestamp.

---

### `GET /api/v1/books/genres/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Returns a summary list of all available genres along with book counts.

#### Responses
- **`200 OK`**:
  ```json
  {
    "results": [
      {
        "genre": "Software Engineering",
        "count": 14
      },
      {
        "genre": "Science Fiction",
        "count": 9
      }
    ]
  }
  ```

---

### `GET /api/v1/authors/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Paginated list of authors with name search.

---

### `GET /api/v1/authors/<id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Retrieves author biography, portrait photo, and linked catalog publications.

---

## 3. Content-Based Recommendation Engine (`/api/v1/recommendations/`)

The recommendation system calculates content-based book similarity using TF-IDF text features, taxonomy overlaps, and author signals.

---

### `GET /api/v1/recommendations/similar/<int:book_id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Retrieves books semantically similar to the specified target book based on cosine similarity and genre overlap.

#### Responses
- **`200 OK`**: List of recommended books with similarity rankings.
  ```json
  [
    {
      "id": 14,
      "title": "Refactoring",
      "author": { "id": 5, "name": "Martin Fowler" },
      "genre": "Software Engineering",
      "cover_image_url": "https://cdn.bookkadeh.com/covers/refactoring.jpg",
      "formats": []
    }
  ]
  ```

---

### `GET /api/v1/recommendations/for-you/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Optional Auth](https://img.shields.io/badge/AUTH-OPTIONAL-yellow?style=flat-square)

**Summary:** Delivers personalized recommendations matching the user's order history, profile interests, and reading preferences (falls back to trending/popular for guests).

#### Responses
- **`200 OK`**: List of personalized book recommendations.

---

## 4. Pricing & VIP Subscriptions (`/api/v1/pricing/`)

Manages VIP subscription plans, proration calculations, coupon code validation, and historical price auditing.

---

### `GET /api/v1/pricing/plans/` & `GET /api/v1/pricing/subscriptions/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Lists all active VIP subscription tiers available for purchase.

#### Responses
- **`200 OK`**:
  ```json
  [
    {
      "id": 1,
      "name": "Silver Tier",
      "slug": "silver-tier",
      "tier": 1,
      "monthly_price": "150000",
      "digital_discount_percent": 15
    },
    {
      "id": 2,
      "name": "Gold Tier",
      "slug": "gold-tier",
      "tier": 2,
      "monthly_price": "290000",
      "digital_discount_percent": 30
    }
  ]
  ```

---

### `GET /api/v1/pricing/subscriptions/me/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Retrieves the user's active subscription and any scheduled/reserved subscriptions waiting for activation.

#### Responses
- **`200 OK`**:
  ```json
  [
    {
      "id": 7,
      "plan": {
        "id": 2,
        "name": "Gold Tier",
        "slug": "gold-tier",
        "tier": 2,
        "monthly_price": "290000",
        "digital_discount_percent": 30
      },
      "status": "ACTIVE",
      "start_date": "2026-09-01T00:00:00Z",
      "end_date": "2026-10-01T00:00:00Z",
      "auto_renew": true,
      "created_at": "2026-09-01T00:00:00Z"
    }
  ]
  ```

---

### `POST /api/v1/pricing/subscriptions/purchase/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Purchases a subscription plan debited directly from the user's wallet. If an existing plan is active, the purchase is safely reserved.

#### Request
```json
{
  "plan_id": 2,
  "auto_renew": true
}
```

#### Responses
- **`201 Created`**: Returns newly created subscription object.
- **`400 Bad Request`**: Insufficient wallet balance or invalid plan ID.

---

### `POST /api/v1/pricing/subscriptions/upgrade/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Upgrades current active subscription to a higher tier. Credits the prorated unused balance of the active plan toward the upgrade fee.

#### Request
```json
{
  "plan_id": 3
}
```

#### Responses
- **`200 OK`**: Returns updated subscription object.

---

### `POST /api/v1/pricing/subscriptions/cancel/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Cancels an active or scheduled subscription, calculating an instant prorated refund credited back to the user's internal wallet.

#### Request
```json
{
  "subscription_id": 7,
  "refund": true
}
```

#### Responses
- **`200 OK`**:
  ```json
  {
    "detail": "Subscription cancelled successfully.",
    "refunded_amount": "193333",
    "subscription": {
      "id": 7,
      "status": "CANCELLED"
    }
  }
  ```

---

### `POST /api/v1/pricing/validate/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Validates a coupon promotion code against active status and expiry dates.

#### Request
```json
{
  "code": "SUMMER2026"
}
```

#### Responses
- **`200 OK`**:
  ```json
  {
    "code": "SUMMER2026",
    "discount_type": "PERCENTAGE",
    "discount_value": "20.00",
    "is_valid": true
  }
  ```
- **`400 Bad Request`**: Invalid or expired discount code.

---

### `GET /api/v1/pricing/books/<book_id>/prices/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Retrieves historical immutable pricing audit ledger for a book.

---

### `POST /api/v1/pricing/books/<book_id>/prices/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-STAFF_ONLY-red?style=flat-square)

**Summary:** Creates a new price record, atomically expiring the previous active price.

#### Request
```json
{
  "value": "490000",
  "min_price": "390000"
}
```

---

## 5. Publishing Operations & Proposals (`/api/v1/publishing/`)

Publishers manage their catalog through structured proposals subjected to administrative moderation.

---

### Public Storefront Discovery

#### `GET /api/v1/publishing/public/publishers/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Lists active publishers for public storefront browsing.

#### `GET /api/v1/publishing/public/publishers/<str:id_or_slug>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Retrieves public profile, bio, website, and published catalog for a publisher.

---

### Publisher Dashboard & Management

#### `GET /api/v1/publishing/publishers/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Lists publisher organizations where the authenticated user holds an active membership.

#### `GET /api/v1/publishing/publishers/<publisher_id>/books/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Lists all books published by the organization.

#### `GET /api/v1/publishing/publishers/<publisher_id>/proposals/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Lists proposals submitted by a publisher organization (filterable with `?status=` and `?proposal_type=`).

#### `GET /api/v1/publishing/proposals/<id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Retrieves granular proposal details including proposed payload changes.

---

### Proposal Submissions

#### `POST /api/v1/publishing/proposals/book-create/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Submits a proposal to publish a brand new book.

```json
{
  "publisher_id": 1,
  "title": "Designing Data-Intensive Applications",
  "author_id": 3,
  "genre": "Computer Science",
  "language": "en",
  "description": "The definitive guide to distributed data systems.",
  "publication_year": 2024,
  "formats": [
    {
      "format_type": "PRINT",
      "price": "600000",
      "stock_quantity": 50
    }
  ]
}
```

#### `POST /api/v1/publishing/proposals/book-update/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Proposes modifications to an existing book's metadata or synopsis.

#### `POST /api/v1/publishing/proposals/book-delete/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Submits a proposal to delist/delete a book.

#### `POST /api/v1/publishing/proposals/author-create/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Submits a proposal to add a new author to the platform.

#### `POST /api/v1/publishing/proposals/author-update/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Submits a proposal to update author biography or details.

#### `POST /api/v1/publishing/proposals/price-change/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Submits a proposed price modification for an existing book format.

#### `POST /api/v1/publishing/proposals/<id>/withdraw/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Staff](https://img.shields.io/badge/AUTH-PUBLISHER_STAFF-purple?style=flat-square)

**Summary:** Allows the submitting publisher to withdraw a pending proposal prior to review.

---

## 6. Cart, Orders & Wishlist (`/api/v1/cart/`)

Coordinates shopping sessions, persistent cart merging, user wishlists, order placement via wallet debit, and order refunds.

---

### `GET /api/v1/cart/items/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Optional Auth](https://img.shields.io/badge/AUTH-OPTIONAL-yellow?style=flat-square)

**Summary:** Retrieves current items in the cart with dynamic discounts applied by the PricingEngine. Works seamlessly for anonymous sessions and authenticated users.

#### Responses
- **`200 OK`**:
  ```json
  [
    {
      "book_id": 10,
      "title": "Clean Architecture",
      "format_id": 15,
      "format_type": "Print Edition",
      "quantity": 1,
      "unit_price": "315000",
      "original_price": "450000",
      "discount_percent": 30,
      "has_discount": true,
      "cover_image_url": "https://cdn.bookkadeh.com/covers/clean_arch.jpg"
    }
  ]
  ```

---

### `POST /api/v1/cart/items/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![Optional Auth](https://img.shields.io/badge/AUTH-OPTIONAL-yellow?style=flat-square)

**Summary:** Adds a book format to the cart or adjusts its quantity.

#### Request
```json
{
  "book_id": 10,
  "format_id": 15,
  "quantity": 2
}
```

---

### `DELETE /api/v1/cart/items/`
![DELETE](https://img.shields.io/badge/DELETE-dc3545?style=for-the-badge) ![Optional Auth](https://img.shields.io/badge/AUTH-OPTIONAL-yellow?style=flat-square)

**Summary:** Removes a specific format item from the cart or clears the entire basket.

#### Query Parameters
- `format_id` (optional): If provided, removes only that format; if omitted, clears the cart.

---

### `POST /api/v1/cart/merge/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Merges anonymous session items into the authenticated user's database cart upon sign-in.

---

### `POST /api/v1/cart/checkout/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Executes the checkout transaction using internal wallet balance. Deducts funds, creates an immutable order snapshot, and provisions digital licenses.

#### Request
```json
{
  "shipping_address_id": 12,
  "discount_code": "SUMMER2026"
}
```

#### Responses
- **`201 Created`**: Order placed successfully.
  ```json
  {
    "id": 89,
    "total_amount": "315000",
    "status": "PAID",
    "created_at": "2026-09-10T21:00:00Z",
    "items": [
      {
        "id": 101,
        "book_title": "Clean Architecture",
        "format_type": "PRINT",
        "price": "315000",
        "quantity": 1
      }
    ]
  }
  ```
- **`400 Bad Request`**: Insufficient wallet balance or empty cart.

---

### `GET /api/v1/cart/orders/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Returns chronological order history for the authenticated user.

---

### `GET /api/v1/cart/orders/<id>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Returns immutable order detail snapshot.

---

### `POST /api/v1/cart/orders/<id>/cancel/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Cancels an eligible order, refunds payment to the user's wallet, and revokes digital licenses.

#### Responses
- **`200 OK`**:
  ```json
  {
    "message": "Order refunded successfully.",
    "status": "REFUNDED",
    "order_id": 89
  }
  ```

---

### Wishlist Endpoints

#### `GET /api/v1/cart/wishlist/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Lists books saved in user's personal wishlist.

#### `POST /api/v1/cart/wishlist/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Adds a book to the wishlist.
```json
{
  "book_id": 10
}
```

#### `DELETE /api/v1/cart/wishlist/<id>/`
![DELETE](https://img.shields.io/badge/DELETE-dc3545?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Removes an item from the wishlist.

---

## 7. Digital Content & DRM Licenses (`/api/v1/content/`)

Controls digital book access permissions (E-Books and Audiobooks) granted upon purchase.

---

### `GET /api/v1/content/licenses/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Lists all active, expired, and revoked digital licenses owned by the authenticated user.

#### Responses
- **`200 OK`**:
  ```json
  [
    {
      "id": 19,
      "book_id": 10,
      "book_title": "Clean Architecture",
      "book_slug": "clean-architecture",
      "book_format_id": 16,
      "format_type": "EBOOK",
      "format_name": "E-Book Edition",
      "is_active": true,
      "valid_from": "2026-09-10T21:00:00Z",
      "valid_until": null,
      "is_valid": true
    }
  ]
  ```

---

## 8. In-App Wallet & Financial Ledger (`/api/v1/wallet/`)

Tracks customer funds, double-entry ledger transactions, deposits, order payments, and refunds.

---

### `GET /api/v1/wallet/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Returns current authenticated user's wallet balance, currency, and account status.

#### Responses
- **`200 OK`**:
  ```json
  {
    "balance": "1500000",
    "currency": "IRR",
    "is_active": true
  }
  ```

---

### `GET /api/v1/wallet/transactions/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Chronological double-entry transaction history for the user's wallet.

#### Responses
- **`200 OK`**:
  ```json
  [
    {
      "id": 142,
      "amount": "500000",
      "transaction_type": "DEPOSIT",
      "created_at": "2026-09-10T18:00:00Z",
      "description": "Online payment gateway charge"
    },
    {
      "id": 143,
      "amount": "-315000",
      "transaction_type": "PURCHASE",
      "created_at": "2026-09-10T21:00:00Z",
      "description": "Payment for Order #89"
    }
  ]
  ```

---

## 9. Payments Gateway & Settlement (`/api/v1/payments/`)

Handles integration with banking payment processors (e.g. Saman Electronic Payment / SEP) to top up user wallets.

---

### `POST /api/v1/payments/wallet/charge/`
![POST](https://img.shields.io/badge/POST-198754?style=for-the-badge) ![JWT Required](https://img.shields.io/badge/AUTH-JWT_REQUIRED-red?style=flat-square)

**Summary:** Initiates an online wallet recharge, generating a secure banking gateway redirection URL and token.

#### Request
```json
{
  "amount": "500000"
}
```

#### Responses
- **`201 Created`**:
  ```json
  {
    "payment_url": "http://localhost:8000/api/v1/payments/sep/redirect/f829a3e0b.../",
    "token": "f829a3e0b..."
  }
  ```

---

### `GET /api/v1/payments/callback/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Callback URL invoked by payment gateway post-transaction. Verifies cryptographic signature and credits the user's wallet upon success.

---

### `GET /api/v1/payments/sep/redirect/<str:gateway_token>/`
![GET](https://img.shields.io/badge/GET-0d6efd?style=for-the-badge) ![Public](https://img.shields.io/badge/AUTH-PUBLIC-informational?style=flat-square)

**Summary:** Gateway redirection endpoint for banking processor settlement.

---

<div align="center">
  <sub>Bookkadeh Platform REST API Contract &copy; 2026. All rights reserved.</sub>
</div>
