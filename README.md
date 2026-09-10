<div align="center">

# 📚 Bookkadeh (بوکده)
### Enterprise-Grade Bilingual Bookstore, Publishing & Subscription Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.15-A30000?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-v5-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814A?style=for-the-badge&logo=celery&logoColor=white)](https://docs.celeryq.dev/)

<p align="center">
  A production-ready, full-stack digital and physical bookstore platform featuring an immutable pricing pipeline, multi-format catalog, publisher proposal moderation, internal wallet ledger, content-based recommendation engine, TanStack React Query caching, and complete bilingual (Persian & English) support.
</p>

[Key Features](#-key-features) •
[Architecture](#-architecture) •
[Quickstart](#-quickstart-guide) •
[API Contract](./API_CONTRACT.md) •
[Deep Specs](./SYSTEM_SPECIFICATION.md) •
[Testing](#-testing--verification)

---

</div>

## 🌟 Key Features

### 🔐 Accounts & Passwordless Authentication
- **Passwordless OTP Authentication**: 6-digit cryptographic verification code delivered via transactional email with 5-minute single-use validity and brute-force throttling.
- **JWT Session Security**: Dual-token architecture (short-lived Access + rotating Refresh tokens) with transparent interceptor refresh queues and token blacklisting.
- **Physical Shipping Address Hub**: Multi-address management with recipient details, province/city categorization, 10-digit postal code validation, and automated default address selection.
- **User Profile & Activity Tracking**: Reading interests, active VIP subscription status, reading statistics, and publisher affiliations.

### 📖 Multi-Format Catalog & Taxonomies
- **Format Flexibility**: Unified representation for **Print Editions**, **E-Books (PDF/EPUB)**, and **Audiobooks** with DRM file access privileges.
- **Rich Semantic Taxonomies**: Multi-level classification using curated genres, conceptual tags, publication years, and language flags.
- **Full-Text Search & Faceting**: Search by title, author biography, genre, or ISBN with PostgreSQL full-text search and Solr standby indexing.
- **Author Portfolios**: Author biographies, bibliographies, and linked publications.

### 🏷️ Dynamic Pricing Engine, Subscriptions & Coupons
- **Centralized Pricing Engine**: Pipeline-based calculation determining base price, applicable format costs, promotional discounts, and member pricing.
- **Historical Price Auditing**: Immutable record of price modifications, tracking changes over time with timestamps and moderator attribution.
- **Automated & Coupon Discounts**: Stacking validation engine supporting percentage-off, fixed-amount discounts, usage quotas, and minimum basket requirements.
- **VIP Subscription Plans**: Tiered reader memberships (e.g. *Gold Tier 30% off*, *Silver Tier 15% off*) with automated 30-day billing cycles, scheduled reservations, and instant prorated wallet refunds upon cancellation.

### 🛒 Commerce, Orders & In-App Wallet
- **Dual-Storage Shopping Cart**: High-performance session cart for anonymous guests seamlessly merged into database-backed persistent storage upon login.
- **Internal Wallet Ledger**: Double-entry bookkeeping tracking deposits, order checkout debits, and cancellation credits with strict decimal precision.
- **Immutable Order Snapshots**: Orders permanently record purchase prices, applied discounts, and shipping addresses at time of transaction to protect against future catalog changes.
- **Digital License Management**: Automatic generation of tamper-resistant digital access licenses for e-books and audiobooks upon checkout completion.

### 🏢 Publisher Portal & Editorial Moderation
- **Multi-Tenant Publisher Organizations**: Publishers operate within isolated workspaces, managing staff roles (Owner, Editor, Member).
- **Proposal-Based Editorial Workflow**: Publishers cannot alter live production data directly; all additions and edits (books, authors, price updates) are submitted as structured proposals.
- **Django Admin Inspection Suite**:
  - Visual thumbnail previews and delta chips directly in the proposal changelist.
  - Interactive side-by-side comparison tables (Diff Cards) contrasting current live data against proposed modifications.
  - Atomically vetted **Approve** and **Reject** workflows with mandatory audit reasoning.

### 🧠 Intelligent Recommendation Engine
- **Content-Based Similarity**: Multi-factor feature weighting combining description TF-IDF, genre overlap, author identity, and taxonomy tags.
- **Offline Indexing & Batch Processing**: Celery tasks compute and cache pairwise book similarity matrices, offloading CPU-intensive processing from API request cycles.
- **Personalized "For You" Feed**: Ranks catalog recommendations tailored to individual user reading history, preferred genres, and profile interests.

### 🎨 Modern Frontend & UX Craftsmanship
- **TanStack React Query v5**: Comprehensive caching layer with request deduplication, background revalidation, and instant navigation without loading flashes.
- **Reactive UI Synchronization**: Shopping cart counts, wishlist toggles, and wallet balances update instantly across headers and views without page reloads.
- **Revamped Glassmorphic Notifications**: Portal-rendered floating toast notifications with pause-on-hover countdown timers, multi-toast stacking, and severity accents.
- **Theme & Internationalization**: Dynamic Light and Dark modes with full RTL (Right-to-Left for Persian) and LTR (Left-to-Right for English) bidirectional layout support.

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client Layer ["Client Layer (React 19 SPA)"]
        UI[Bookkadeh UI / Pages]
        RQ[TanStack React Query v5 Cache]
        API_CLIENT[ApiClient Axios + JWT Queue]
        UI --> RQ --> API_CLIENT
    end

    subgraph API Gateway ["Django REST Framework (DRF 3.15 / Django 5.2)"]
        AUTH[accounts / Auth & OTP]
        CAT[catalog / Books & Authors]
        PRICE[pricing / Engine & Subscriptions]
        CART[cart / Basket & Checkout]
        PUB[publishing / Organization & Proposals]
        WAL[wallet / Financial Ledger]
        REC[recommendations / Content-Based Recs]
    end

    API_CLIENT -->|Bearer JWT / REST| API Gateway

    subgraph Async & Storage ["Storage & Background Processing"]
        PG[(PostgreSQL 16 Database)]
        REDIS[(Redis 7 Broker & Cache)]
        CELERY[Celery Workers & Beat]
        ADMIN[Custom Django Admin Moderation]
    end

    API Gateway --> PG
    API Gateway --> REDIS
    REDIS --> CELERY
    CELERY --> PG
    ADMIN --> PG
```

---

## 📁 Repository Structure

```
bkstore-PA-AT/
├── backend/                             # Django 5.2 & DRF Backend Service
│   ├── accounts/                        # Custom User, OTP authentication, address management
│   ├── catalog/                         # Books, Authors, Genres, Tags, and catalog search
│   ├── pricing/                         # PricingEngine, historical prices, discounts, VIP plans
│   ├── cart/                            # Shopping cart, checkout orchestrator, orders, wishlist
│   ├── content/                         # Digital licenses, reading access permissions
│   ├── publishing/                      # Publisher organizations, proposals, admin review suite
│   ├── wallet/                          # Wallet balances, transaction ledger, payment processing
│   ├── recommendations/                 # Recommendation vectors, pairwise similarities, feeds
│   ├── core/                            # Project settings, Celery app, WSGI/ASGI handlers
│   ├── templates/                       # Admin customization templates (proposal diff & actions)
│   ├── static/                          # Admin CSS & static assets
│   ├── manage.py                        # Django management CLI
│   └── requirements.txt                 # Backend Python dependencies
│
├── frontend/my-app/core/                # React 19 Frontend SPA
│   ├── src/
│   │   └── ContextEx2/
│   │       ├── Components/              # Reusable UI widgets (Navbar, Footer, Notification)
│   │       ├── Context/                 # Auth, Theme, and Language Context Providers
│   │       ├── Hooks/queries/           # TanStack React Query domain hooks & key factory
│   │       ├── Pages/                   # Application route views (Home, Book, Dashboard, etc.)
│   │       │   ├── auth/                # Login, Signup, OTP Verification, Password Recovery
│   │       │   ├── dashboard/           # User dashboard (Shelf, VIP Plans, Addresses, Wallet)
│   │       │   ├── publisher-panel/     # Publisher portal, book uploads, proposal management
│   │       │   └── library/             # Infinite catalog, search, reading views
│   │       ├── Services/                # Axios API service clients
│   │       └── Styles/                  # Modular CSS stylesheets with CSS variable theming
│   ├── package.json                     # Frontend Node dependencies & build scripts
│   └── public/                          # Static assets and index.html template
│
├── SYSTEM_SPECIFICATION.md              # Deep Technical Specification & Subsystem Architecture
└── README.md                            # Repository Overview & Quickstart Guide
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Python:** `3.12+`
- **Node.js:** `18+` & `npm`
- **Redis:** `7.x` (for Celery background tasks & caching)
- **Database:** PostgreSQL (recommended for production) or SQLite (default local development)

---

### 1. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Apply database migrations
python manage.py migrate

# 5. Compile bilingual translation catalogs
python manage.py compilemessages

# 6. Seed initial catalog, publishers, and demo data
python manage.py seed_catalog
python manage.py generate_demo_data

# 7. Create an administrator account
python manage.py createsuperuser

# 8. Start the Django development server
python manage.py runserver
```
The Django API and Admin will be accessible at:
- **REST API:** `http://localhost:8000/api/v1/`
- **Django Admin Portal:** `http://localhost:8000/admin/`

---

### 2. Celery Worker & Beat (Optional for local development, recommended)

In separate terminal tabs with the virtual environment activated:

```bash
# Start Celery Worker
celery -A core worker -l info

# Start Celery Beat Scheduler
celery -A core beat -l info
```

---

### 3. Frontend Setup

```bash
# 1. Navigate to the frontend application directory
cd frontend/my-app/core

# 2. Install Node dependencies
npm install

# 3. Launch the development server
npm start
```
The React SPA will launch at `http://localhost:3000`.

---

## 📡 API Overview
 
 The platform exposes a RESTful API versioned under `/api/v1/`:
 
 | Module | Base Path | Key Endpoints & Capabilities |
 | :--- | :--- | :--- |
-| **Authentication** | `/api/v1/accounts/` | `login/`, `signup/`, `otp/request/`, `otp/verify/`, `token/refresh/`, `addresses/` |
-| **Catalog** | `/api/v1/catalog/` | `books/`, `books/<id>/`, `authors/`, `genres/`, `tags/`, `search/?q=` |
-| **Pricing & VIP** | `/api/v1/pricing/` | `plans/`, `subscriptions/me/`, `subscriptions/purchase/`, `subscriptions/cancel/`, `validate/` |
-| **Cart & Orders** | `/api/v1/cart/` | ``, `items/`, `checkout/`, `orders/`, `orders/<id>/`, `wishlist/` |
-| **Publishing** | `/api/v1/publishing/` | `publishers/`, `publishers/mine/`, `proposals/`, `proposals/<id>/withdraw/` |
-| **Wallet** | `/api/v1/wallet/` | `balance/`, `transactions/`, `deposit/`, `withdraw/` |
-| **Recommendations** | `/api/v1/recommendations/` | `books/<id>/similar/`, `for-you/`, `trending/` |
+| **Authentication** | `/api/v1/auth/` | `register/`, `login/`, `login/otp/`, `otp/request/`, `profile/`, `addresses/` |
+| **Catalog** | `/api/v1/` | `books/`, `books/<id>/`, `books/new/`, `books/genres/`, `authors/` |
+| **Recommendations** | `/api/v1/recommendations/` | `similar/<book_id>/`, `for-you/` |
+| **Pricing & VIP** | `/api/v1/pricing/` | `plans/`, `subscriptions/me/`, `subscriptions/purchase/`, `subscriptions/upgrade/`, `validate/` |
+| **Publishing** | `/api/v1/publishing/` | `public/publishers/`, `publishers/`, `proposals/`, proposal submission routes |
+| **Cart & Orders** | `/api/v1/cart/` | `items/`, `merge/`, `checkout/`, `orders/`, `wishlist/` |
+| **Digital Content** | `/api/v1/content/` | `licenses/` (DRM e-book & audiobook licenses) |
+| **Wallet Ledger** | `/api/v1/wallet/` | ``, `transactions/` (internal double-entry balance & ledger) |
+| **Payments Gateway** | `/api/v1/payments/` | `wallet/charge/`, `callback/`, `sep/redirect/<token>/` |

For an exhaustive, visually formatted API contract with method badges, parameter tables, request schemas, and JSON payload examples for all 60+ endpoints, refer to:

👉 **[API_CONTRACT.md](./API_CONTRACT.md)**

---

## 🧪 Testing & Verification

The codebase maintains rigorous automated test coverage across all domain applications:

```bash
# Run backend test suite (210 unit and integration tests)
cd backend
source env/bin/activate
python manage.py test accounts catalog pricing publishing recommendations cart content wallet

# Run frontend production build
cd ../frontend/my-app/core
npm run build
```

---

## 📖 Deep Technical Specification

For an exhaustive architectural deep dive, mathematical formulas for similarity scoring, historical price audit mechanics, proposal lifecycle state machines, and database entity relationship diagrams, refer to:

👉 **[SYSTEM_SPECIFICATION.md](./SYSTEM_SPECIFICATION.md)**

---

<div align="center">
  <sub>Built with ❤️ by the Bookkadeh Engineering Team.</sub>
</div>
