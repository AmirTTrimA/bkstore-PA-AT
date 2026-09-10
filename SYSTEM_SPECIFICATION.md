# Bookkadeh Platform — Deep Architecture & Backend Specification
### Technical Engineering Report & Subsystem Contracts

**System:** Bookkadeh Bookstore (`bkstore`)  
**Repository:** Full-Stack Monorepo (`backend/` and `frontend/`)

---

## 1. Introduction

The Bookstore platform is a full-stack e-commerce application specializing in physical and digital book sales. The backend, built with Django 5.2 and Django REST Framework, provides a complete REST API handling user authentication, product catalog browsing, cart management, order processing, subscription-based pricing, discount code validation, and digital license management.

The project was developed in three planned phases:

- **Phase 1:** Core infrastructure — user authentication (passwordless OTP login), book catalog (browse and search), and basic session-based cart.
- **Phase 2:** Complete e-commerce workflow including historical pricing, a centralized Pricing Engine, automatic and coupon-based discounts, persistent shopping carts, CheckoutService-based order processing, immutable order snapshots, digital license generation, customer order history, background email processing, and comprehensive automated testing.
- **Phase 3 (Designed & Planned):** Recommendation system foundation — catalog schema redesign for semantic reasoning, curated demonstration dataset, and content-based recommendation engine. A social media layer is planned as a future extension to leverage recommendation data.

In addition to the originally planned phases, the backend now includes an implemented **publisher management and proposal workflow**. This subsystem allows publisher organizations to submit controlled catalog and pricing changes for administrative moderation rather than modifying production catalog data directly.

The backend has since been extended with an implemented **wallet and account-payment subsystem**. Wallet balances are used as the payment source for checkout, wallet transactions provide an auditable ledger for balance changes, and order cancellation can return the paid amount to the customer's wallet while revoking digital licenses.

---

## 2. System Architecture

### 2.1 Technology Stack

| Layer | Technology | Version/Package |
|-------|-----------|-----------------|
| **Framework** | Django | 5.2 |
| **API Layer** | Django REST Framework | Latest via `rest_framework` |
| **Authentication** | Simple JWT + dj-rest-auth + django-allauth | JWT with token rotation and blacklisting |
| **Database** | PostgreSQL (primary) / SQLite (development fallback) | — |
| **Search Engine** | PostgreSQL Full-Text Search (active), Apache Solr via Haystack (configured, on standby) | Haystack + Solr |
| **Background Tasks** | Celery + Celery Beat + Redis (broker) | Periodic and on-commit tasks |
| **Email Backend** | Console backend (development), production-ready SMTP configuration | `django.core.mail` |
| **Internationalization** | Django i18n | English (default) + Farsi |

### 2.2 Application Modules

| Django App | Responsibility |
|------------|---------------|
| `accounts` | Custom User model, OTP-based passwordless authentication, user profile hub |
| `catalog` | Author and Book models, public catalog browsing, full-text search, genre and tag taxonomies [PHASE 3 — PENDING] |
| `pricing` | Historical pricing, centralized PricingEngine, automatic discounts, coupon validation, subscription plans, user subscriptions, and pricing pipeline. |
| `cart` | Cart management (session + database dual storage), wishlist, order processing, checkout |
| `content` | Digital license management, license expiry enforcement |
| `publishing` | Publisher organizations, publisher memberships, proposal-based catalog and pricing changes, administrative moderation, and publisher-facing proposal APIs |
| `wallet` | Customer wallet balances, wallet transactions, payment/refund operations, and wallet-facing APIs |
| `recommendations` [PHASE 3 — PENDING] | Content-based similarity computation, offline processing, recommendation serving |
| `social` [PHASE 3 — PENDING] | Topic-anchored discussion system, multi-level moderation pipeline, author/publisher promotion management |

### 2.3 External Dependencies

- **Celery/Redis:** Handles asynchronous tasks (order confirmation emails) and scheduled tasks (OTP expiry cleanup, license expiry processing). In Phase 3, Celery will also orchestrate offline recommendation computation.
- **django-allauth / dj-rest-auth:** Provides authentication scaffolding including rate limiting (5 failed login attempts per minute), email verification infrastructure, and JWT cookie security.

---

## 3. Data Model

### 3.1 Users & Authentication (`accounts`)

**User** (extends Django's `AbstractUser`)

- Inherited: `username`, `email`, `password`, `first_name`, `last_name`, `is_active`, `is_staff`, `date_joined`
- Custom: `job_or_major` (CharField, nullable), `hobbies_or_likings` (TextField, nullable)
- Purpose of custom fields: Input data for Phase 3 recommendation engine [PHASE 3 — PENDING]

**OTPCode**

- `user`: ForeignKey → User (CASCADE)
- `code`: CharField(6) — auto-generated 6-digit numeric string
- `created_at`: DateTimeField (auto_now_add)
- `expires_at`: DateTimeField (default: 5 minutes from creation)
- `is_valid`: BooleanField (default: True)
- **Behavior:** Previous valid codes for a user are invalidated upon new code generation. Codes are single-use and expire after 5 minutes.

**Address**

Represents saved physical shipping addresses for customer accounts.

- `user`: ForeignKey → User (CASCADE, related_name="addresses")
- `title`: CharField(64) — label for the address (e.g. "Home", "Work", default: "Home")
- `recipient_name`: CharField(255) — full name of receiver
- `phone_number`: CharField(20) — contact telephone/mobile number
- `country`: CharField(100, default="Iran")
- `province`: CharField(100)
- `city`: CharField(100)
- `address_line`: TextField — detailed street address, building, and unit number
- `postal_code`: CharField(20) — 10-digit postal code
- `is_default`: BooleanField (default: False)
- `created_at`, `updated_at`: DateTimeField
- **Behavior:** If an address is marked as `is_default=True`, any existing default address for that user is automatically unset. If a user only has one address, it automatically defaults to `is_default=True`. Exposed as part of user profile and selectable by `address_id` during checkout.

### 3.2 Product Catalog (`catalog`)

#### 3.2.1 Author

**Phase 1/2 Fields (Implemented):**

- `name`: CharField(255) — human-readable display name
- `biography`: TextField (optional)
- `created_at`, `updated_at`: DateTimeField

**Phase 3 Fields [PHASE 3 — PENDING]:**

- `normalized_name`: CharField (unique or indexed) — lowercased, stripped version of `name` for deduplication and matching
- `primary_language`: CharField (ISO language code, e.g. `en`, `fa`) — dominant writing language of the author
- `active_years`: CharField (optional, future enrichment — not required for initial Phase 3)

**Design Rules:**

- An Author must exist before a Book can reference it
- Author fields do **not** contain popularity, ranking, or recommendation data
- Author biography enriches meaning but does **not** define similarity

#### 3.2.2 Book

**Phase 1/2 Fields (Implemented):**

- `author`: ForeignKey → Author (CASCADE)
- `title`: CharField(255) — human-readable
- `slug`: SlugField (unique, URL-friendly)
- `isbn`: CharField(17, unique) — technical identifier, not semantic
- `description`: TextField
- `cover_image_url`: URLField (optional)
- `genre`: CharField (choices: Fiction, Science Fiction, History, Science, Technology, Business) — **to be replaced by M2M Genre relation in Phase 3**
- `is_digital`: BooleanField — flags availability as e-book
- `is_audio`: BooleanField — flags availability as audiobook
- `digital_file_path`, `audio_file_path`: CharField — paths for secure file serving
- `created_at`, `updated_at`: DateTimeField

**Phase 3 Fields [PHASE 3 — PENDING]:**

- `language`: CharField (ISO language code, mandatory) — language of the book content; recommendation pipeline only processes `en`
- `genres`: ManyToManyField → Genre (at least one required for semantic eligibility)
- `tags`: ManyToManyField → Tag (optional, 3–6 recommended per book)
- `publication_year`: IntegerField (optional, weak semantic signal for contextual similarity)
- `edition`: CharField or SmallIntegerField (optional, contextual not semantic)

**Existing Field to Remove/Replace [PHASE 3 — PENDING]:**

- `genre` (CharField with choices) — replaced by M2M `genres` relation

**Commerce Fields (Retained, Non-Semantic):**

- `cover_image_url`, `is_digital`, `is_audio`, `digital_file_path`, `audio_file_path` — explicitly excluded from semantic processing

**Semantic Eligibility Rule [PHASE 3 — PENDING]:**

A Book is considered **semantically eligible** for recommendation processing when:
- `description` is non-empty
- `language` is a supported language (initially only `en`)
- At least one `genre` exists
- `author` exists

**Design Rules:**

- Book fields separated into semantic (description, language, genres, tags, publication_year) and commerce (prices, file paths, flags) categories
- No intelligence/computation fields stored on the Book model itself
- Schema decisions treated as long-term contracts

#### 3.2.3 Genre [PHASE 3 — PENDING]

**Purpose:** Represents high-level categorical meaning, not marketing labels. Genres are curated, not user-generated.

**Fields:**

- `name`: CharField — human-readable genre name (e.g. "Science Fiction")
- `slug`: SlugField (unique) — URL-safe identifier
- `normalized_name`: CharField (unique or indexed) — for matching and comparison
- `description`: TextField (optional) — short explanation of genre scope, useful for curation and future explainability
- `parent_genre`: ForeignKey → self (optional, future) — allows genre hierarchy (e.g. Fiction → Science Fiction); explicitly postponed beyond initial Phase 3

**Design Rules:**

- Genre set is intentionally small and stable (target: 5–8 genres)
- A Book can belong to multiple genres (1–2 recommended)
- Genres carry moderate semantic weight in recommendations

#### 3.2.4 Tag [PHASE 3 — PENDING]

**Purpose:** Represents specific concepts, themes, motifs, or topics. Tags provide fine-grained semantic signals and explicit overlap anchors for recommendations.

**Fields:**

- `name`: CharField — human-readable tag (e.g. "time travel", "machine learning")
- `normalized_name`: CharField (unique) — for deduplication and matching
- `description`: TextField (optional) — clarifies intended meaning, prevents semantic drift
- `language`: CharField (ISO language code, optional) — language of the tag term; required if multilingual tagging is added later

**Design Rules:**

- Tags are more numerous than genres (target: 30–60 tags)
- Tags are reusable across books
- Tags provide strong overlap signals for similarity computation
- Tags are controlled vocabulary, not free text
- Per book: 3–6 tags recommended, with at least one shared tag and one differentiating tag

### 3.3 Pricing (`pricing`)

The pricing subsystem is responsible for determining the selling price of every book at the moment of purchase. Rather than embedding pricing logic throughout the application, all pricing decisions are centralized within the `PricingEngine`, which applies pricing rules in a consistent, deterministic pipeline.

The pricing system separates **pricing data** (stored in models) from **pricing behavior** (implemented by the PricingEngine).

#### 3.3.1 Price

Represents the historical selling price of a book.

- `book`: ForeignKey → Book (CASCADE, related_name="prices")
- `value`: DecimalField (max_digits=12, decimal_places=0) — stored in whole units of Iranian Rial (IRR)
- `currency`: CharField(3, default="IRR")
- `min_price`: DecimalField (nullable) — optional minimum selling price after discounts
- `effective_from`: DateTimeField
- `effective_until`: DateTimeField (nullable)

**Design Rules**

- Prices are immutable historical records.
- Price updates never overwrite previous records.
- Creating a new price automatically expires the previous active price.
- At any moment, the active price is the newest record where:
  - `effective_from <= now`
  - `effective_until IS NULL` or `effective_until > now`

---

#### 3.3.2 Discount

Represents a pricing rule that may apply automatically or through a coupon.

##### General

- `name`
- `discount_type`
    - Percentage
    - Fixed amount
- `value`
- `description`

##### Scope

Determines which books the discount applies to.

Supported scopes:

- Entire store
- Individual book
- Author
- Genre
- Book format

Book format supports:

- Digital
- Physical
- Audiobook

##### Availability

- `is_active`
- `valid_from`
- `valid_until`
- `activation`
    - Automatic
    - Coupon

##### Behavior

The model exposes helper methods:

- `is_active_now()`
- `is_applicable(book)`
- `can_apply_to(book)`

These methods determine whether a discount is currently valid and whether it applies to a particular book. They contain no pricing calculations.

---

#### 3.3.3 DiscountCode

Represents a redeemable coupon that activates a `Discount`.

- `discount`: ForeignKey → Discount
- `code`: CharField(unique)
- `is_active`
- `max_uses`
- `times_used`

Unlike automatic discounts, discount codes require explicit customer input during checkout.

Coupon usage is tracked after a successful checkout by incrementing `times_used`.

---

#### 3.3.4 SubscriptionPlan

Defines subscription tiers available to customers.

- `name`
- `slug`
- `monthly_price`
- `digital_discount_percent`
- `is_active`

Subscription plans define pricing benefits but do not calculate discounts directly.

---

#### 3.3.5 UserSubscription

Represents a customer's active subscription.

- `user`
- `plan`
- `is_active`
- `start_date`
- `end_date`

Method:

- `is_current()`

Returns `True` only when the subscription is active and has not expired.

---

#### 3.3.6 Pricing Engine

All pricing calculations are delegated to the `PricingEngine`.

For every purchased book, the engine executes the following pricing pipeline:

```
Base Price
      ↓
Automatic Discount
      ↓
Coupon Discount
      ↓
Subscription Discount
      ↓
Minimum Price Enforcement
      ↓
Final Price
```

The engine is responsible for:

- Resolving the currently active historical price.
- Selecting the best applicable automatic discount.
- Validating and applying coupon discounts.
- Applying subscription discounts.
- Enforcing minimum selling prices.
- Returning a complete pricing breakdown.

Rather than returning only the final price, the engine produces a `PricingResult`, which includes:

- Base price
- Applied automatic discount and amount
- Applied coupon discount and amount
- Applied subscription discount and amount
- Final calculated selling price

This allows other parts of the application, particularly the checkout system, to build immutable order snapshots while remaining completely independent of pricing rules.


### 3.4 Cart & Orders (`cart`)

The cart subsystem manages the customer's purchasing workflow, from storing selected books to creating immutable order records after a successful checkout. Pricing calculations are intentionally delegated to the `PricingEngine`, allowing the cart module to focus solely on order orchestration and persistence.

#### 3.4.1 Cart

Represents a persistent shopping cart for an authenticated user.

- `user`: OneToOneField → User
- `created_at`
- `updated_at`

Each authenticated user owns exactly one persistent cart. Anonymous users temporarily store cart contents in the session until authentication, after which the session cart is merged into the database cart.

---

#### 3.4.2 CartItem

Represents a single book within a cart.

- `cart`: ForeignKey → Cart
- `book`: ForeignKey → Book
- `quantity`

A unique constraint on `(cart, book)` prevents duplicate entries for the same book.

---

#### 3.4.3 Order

Represents an immutable purchase transaction.

Orders store a complete financial and shipping snapshot so that future changes to books, prices, or discounts do not affect historical purchases.

Relationships:

- `user`
- `discount_code`

Financial snapshot:

- `subtotal`
- `discount_amount`
- `total_amount`

Shipping snapshot:

- `shipping_name`
- `shipping_address_line1`
- `shipping_city`
- `shipping_country`

Order metadata:

- `status`
- `created_at`

Supported order states include:

- Pending
- Processing
- Shipped
- Delivered
- Cancelled

The current payment workflow also uses a **`REFUNDED`** state for orders whose wallet payment has been returned after cancellation. Successful wallet payment moves a newly created order from its initial `PENDING` state to `PROCESSING`.

---

#### 3.4.4 OrderItem

Represents an immutable purchased item belonging to an Order.

Relationships:

- `order`
- `book`

Snapshot fields:

- `quantity`
- `snapshot_price`
- `snapshot_title`
- `snapshot_author_name`

Rather than referencing mutable catalog data during display, each OrderItem stores the exact information visible to the customer at the moment of purchase.

---

#### 3.4.5 WishlistItem

Represents books saved for future purchase.

Fields:

- `user`
- `book`
- `added_at`

Each user may store a book only once in their wishlist through a unique `(user, book)` constraint.

---

#### 3.4.6 Checkout Service

Checkout is coordinated by `CheckoutService`, which orchestrates the complete purchasing workflow while delegating pricing decisions to the `PricingEngine`.

The checkout pipeline consists of the following stages:

```
Customer Cart
      │
      ▼
Build Order Snapshot
      │
      ▼
PricingEngine (per book)
      │
      ▼
Create Order
      │
      ▼
Create Order Items
      │
      ▼
Grant Digital Licenses
      │
      ▼
Consume Coupon
      │
      ▼
Clear Cart
```

The service is intentionally divided into small private methods, each responsible for a single stage of the workflow:

- `_resolve_shipping_data()`
- `_build_order_snapshot()`
- `_create_order()`
- `_create_order_items()`
- `_grant_licenses()`
- `_consume_coupon()`
- `_clear_cart()`

This separation improves maintainability, simplifies testing, and keeps pricing logic isolated from order management.

`_resolve_shipping_data()` implements conditional physical vs. digital checkout rules:
- If the cart contains any items with format `PHYSICAL`, a shipping address is strictly required. Customers may supply either an `address_id` (referencing an `Address` owned by the user) or explicit shipping fields (`shipping_name`, `shipping_address_line1`, `shipping_city`, `shipping_country`). Supplying `address_id` automatically populates the snapshot fields from the saved address model.
- If the cart contains exclusively digital or audiobook formats, shipping fields are optional and default to empty snapshot strings, allowing frictionless digital checkouts.

The checkout workflow was later extended to use the customer's wallet as the payment source. Wallet withdrawal occurs before the order is finalized and before digital licenses are granted. If the wallet does not contain sufficient funds, checkout is rejected and the surrounding database transaction is rolled back.

Order cancellation is coordinated by `CheckoutService.cancel_order()`. A cancellable paid order is refunded to the customer's wallet, any licenses granted from that order are deactivated, and the order is transitioned to `REFUNDED`. The cancellation and refund operation is atomic.

---

#### 3.4.7 Cart APIs

The cart module exposes REST endpoints for managing the customer purchasing workflow.

Cart:

- View current cart
- Add items
- Remove items
- Merge anonymous session cart after authentication

Checkout:

- Submit checkout request
- Validate coupon
- Create immutable order
- Generate digital licenses
- Empty purchased cart

Orders:

- View authenticated user's order history
- Retrieve complete details of a previous order

Wishlist:

- Add books
- Remove books
- View saved books

### 3.5 Publishing & Proposal Management (`publishing`)

The publishing subsystem represents external publishing organizations and provides a controlled workflow for proposing changes to the bookstore catalog and pricing. Publishers do not modify catalog records directly. Instead, authorized publisher members create proposals which remain pending until reviewed through the administrative moderation workflow.

The design separates **workflow metadata** from **proposal-specific data**. A generic `Proposal` stores the lifecycle, publisher, submitter, reviewer, and timestamps, while dedicated detail models store the fields required by each proposal type.

#### 3.5.1 Publisher

**Publisher** represents a publishing organization that may manage and propose changes to bookstore catalog content.

Fields:

- `name`: CharField(255, unique) — organization name
- `slug`: SlugField(unique) — URL-friendly identifier generated from the organization name when not supplied
- `description`: TextField (optional)
- `website`: URLField (optional)
- `contact_email`: EmailField
- `is_active`: BooleanField — controls whether the organization is currently active
- `created_at`, `updated_at`: DateTimeField

A Publisher may have multiple active or inactive members and multiple proposals.

#### 3.5.2 PublisherMembership

**PublisherMembership** associates a platform `User` with a publisher organization.

Fields:

- `publisher`: ForeignKey → Publisher (CASCADE)
- `user`: OneToOneField → User (CASCADE)
- `role`: Choice field — `OWNER`, `MANAGER`, or `EDITOR`
- `is_active`: BooleanField
- `joined_at`: DateTimeField

The current implementation allows all three roles to participate in the publisher proposal workflow. The one-to-one user relationship ensures that a platform user belongs to at most one publisher organization.

#### 3.5.3 Proposal

**Proposal** is the generic workflow container for publisher requests.

Proposal types:

- `BOOK_CREATE`
- `BOOK_UPDATE`
- `BOOK_DELETE`
- `AUTHOR_CREATE`
- `AUTHOR_UPDATE`
- `PRICE_CHANGE`

Proposal states:

- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `APPLIED`
- `REJECTED`

The current implementation additionally uses **`WITHDRAWN`** for a publisher-initiated withdrawal of a pending proposal. The current proposal lifecycle uses `PENDING` as the moderation-waiting state; earlier references to `SUBMITTED` describe the previous terminology. Withdrawn proposals remain stored rather than being deleted so that their lifecycle remains auditable.

Relationships:

- `publisher`: ForeignKey → Publisher
- `submitted_by`: ForeignKey → User
- `reviewed_by`: nullable ForeignKey → User

Workflow metadata:

- `title`
- `review_notes`
- `created_at`
- `submitted_at`
- `reviewed_at`
- `applied_at`

A proposal is initially submitted in the `SUBMITTED` state through the publisher API. Approval applies the requested change and transitions the proposal to `APPLIED`. Rejection records the reviewer and rejection reason and transitions the proposal to `REJECTED`.

In the current implementation, the moderation-waiting state is represented by `PENDING`; the `WITHDRAWN` state is used when an authorized publisher member withdraws a pending proposal before moderation.

The proposal model contains only generic workflow information. Proposal-specific fields are stored in dedicated one-to-one detail models.

#### 3.5.4 Book Proposal Types

**BookCreateProposal** stores the requested data for creating a new book.

It includes:

- `proposal`: OneToOneField → Proposal
- `author`: ForeignKey → Author
- `title`
- `isbn`
- `description`
- `cover_image_url`
- `genre`
- `is_digital`
- `is_audio`
- `digital_file_path`
- `audio_file_path`
- `created_book`: nullable OneToOneField → Book

`created_book` is populated only after the proposal has been approved and the requested Book has actually been created.

**BookUpdateProposal** stores the proposed replacement values for an existing Book.

It includes:

- `proposal`: OneToOneField → Proposal
- `book`: ForeignKey → Book
- the editable Book fields represented by the proposal detail

The existing Book is not modified while the proposal is `SUBMITTED`; the changes are applied only after approval.

**BookDeleteProposal** identifies a Book that a publisher requests to remove and records the reason for the request.

It includes:

- `proposal`: OneToOneField → Proposal
- `book`: ForeignKey → Book
- `reason`

#### 3.5.5 Author Proposal Types

**AuthorCreateProposal** stores the information required to create an Author:

- `proposal`: OneToOneField → Proposal
- `name`
- `biography`

**AuthorUpdateProposal** stores replacement information for an existing Author:

- `proposal`: OneToOneField → Proposal
- `author`: ForeignKey → Author
- `name`
- `biography`

As with book proposals, author records are changed only when the corresponding proposal is approved.

#### 3.5.6 Price Change Proposal

**PriceChangeProposal** represents a requested change to a book's selling price.

Fields:

- `proposal`: OneToOneField → Proposal
- `book`: ForeignKey → Book
- `value`: DecimalField
- `currency`: CharField(3)
- `min_price`: DecimalField (nullable)
- `reason`: TextField (optional)

Price proposals do not modify the current price when submitted. When approved, the workflow calls the existing `Book.change_price()` business method so that historical pricing behavior remains centralized in the catalog/pricing domain.

#### 3.5.7 Proposal Workflow Rules

The publishing subsystem follows a proposal-first architecture:

```text
Publisher Member
      │
      ▼
Create Proposal
      │
      ▼
SUBMITTED
      │
      ├───────────────┐
      ▼               ▼
   REJECT          APPROVE
      │               │
      ▼               ▼
  REJECTED         APPLY CHANGE
                      │
                      ▼
                   APPLIED
```

Important design rules:

- Publisher members submit proposals rather than modifying catalog records directly.
- Proposal creation and its detail record are created atomically through `ProposalService`.
- Approval and rejection are performed through the centralized `ProposalService`.
- Catalog changes are applied only after successful approval.
- Book price changes continue to use the existing pricing business method, preserving price history.
- Submitted proposal data is treated as immutable during moderation.
- The publisher API never exposes administrative approval functionality.
- A pending proposal may be withdrawn by an authorized publisher member before moderation is completed.
- Withdrawal records a terminal `WITHDRAWN` state instead of deleting the proposal.

#### 3.5.8 Publishing Admin & API Architecture

The Django Admin provides the administrative moderation interface for publishers, memberships, proposals, and proposal-specific detail records. Administrators can approve or reject submitted proposals, while applied proposals remain protected from deletion.

The publisher API provides the frontend with:

- the current user's publisher memberships
- publisher-specific proposal listing
- proposal detail retrieval
- proposal filtering by status and proposal type
- proposal submission for all implemented proposal types
- proposal withdrawal for pending proposals created by the authenticated publisher member

Publisher access is isolated through active membership checks and object-level proposal authorization. A user cannot access proposals belonging to another publisher.

Proposal withdrawal follows the same publisher-isolation rules. Only an active member of the proposal's publisher may request withdrawal, and withdrawal is limited to proposals that are still pending moderation.

### 3.6 Digital Licensing (`content`)

The content subsystem manages customer ownership of purchased digital products. Rather than relying solely on order history, digital access is granted through persistent `License` records, allowing the application to determine whether a user is authorized to download or read protected content.

#### 3.5.1 License

Represents a customer's ownership of a digital book or audiobook.

Relationships:

- `user`: ForeignKey → User (CASCADE)
- `book`: ForeignKey → Book (PROTECT)
- `order`: ForeignKey → Order (SET_NULL, nullable)

License status:

- `is_active`: BooleanField (default: True)
- `valid_from`: DateTimeField (default: now)
- `valid_until`: DateTimeField (nullable — `NULL` represents a perpetual license)

Constraints:

- Unique `(user, book)` constraint prevents duplicate licenses for the same purchased content.

Methods:

- `is_valid()`

Returns `True` only when:

- the license is active, and
- the license has not expired (or has no expiration date).

---

#### 3.5.2 License Lifecycle

Digital licenses are generated automatically during checkout as part of the `CheckoutService` workflow.

For every purchased item:

- Physical books do not generate licenses.
- Digital books generate perpetual licenses.
- Audiobooks generate perpetual licenses.
- Existing licenses are updated rather than duplicated using `update_or_create()`.

License generation occurs after the Order and OrderItems have been created and before the checkout transaction completes, ensuring that successful purchases immediately grant access to purchased digital content.

The resulting License becomes the single source of truth for future authorization checks when accessing protected digital resources.

---

### 3.7 Wallet & Account Payments (`wallet`)

The wallet subsystem provides each authenticated customer with an internal account balance that can be used to pay for bookstore orders. Balance changes are represented by dedicated transaction records rather than by modifying the balance without an audit record.

#### 3.7.1 Wallet

**Wallet** represents the customer's current stored balance. Each user receives one wallet automatically when the user account is created.

Fields:

- `user`: OneToOne relationship → User
- `balance`: DecimalField — current available wallet balance
- audit timestamps

The wallet is created automatically through a `post_save` signal on the user model so that a newly created customer receives a wallet without a separate provisioning request.

#### 3.7.2 WalletTransaction

**WalletTransaction** records every balance mutation performed through the wallet domain.

Fields include:

- `wallet`: ForeignKey → Wallet
- `transaction_type`: identifies the reason for the balance change
- `amount`: DecimalField
- `description`: human-readable transaction description
- transaction creation timestamp

The transaction ledger distinguishes balance additions such as deposits and refunds from balance deductions such as order payments. Transactions are retained as history and are exposed to the authenticated customer through the wallet transaction-history API.

#### 3.7.3 Wallet Service

All wallet balance mutations are centralized within `WalletService`. The service performs atomic balance updates and records the corresponding `WalletTransaction`. Withdrawals validate available balance and raise a domain-specific `InsufficientBalanceError` when funds are insufficient. Row-level locking is used during balance mutation to protect the wallet from concurrent updates.

The service is used by checkout rather than allowing views or serializers to modify wallet balances directly. This keeps financial state changes inside one business boundary.

## 4. API Design

> [!NOTE]
> For a visually enhanced, exhaustive API specification including method badges, request/response JSON schemas, parameters, and HTTP status codes for all endpoints across the platform, refer to the dedicated standalone **[API_CONTRACT.md](./API_CONTRACT.md)**.

### 4.1 Authentication & User Hub Endpoints (`/api/v1/auth/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/api/v1/auth/register/` | No | Register a new user account with email, username, and password. |
| POST | `/api/v1/auth/login/` | No | Authenticate using username and password. Returns JWT access and refresh tokens. |
| POST | `/api/v1/auth/login/otp/` | No | Authenticate using username/email and a valid OTP. Returns JWT access and refresh tokens. |
| POST | `/api/v1/auth/refresh/` | No | Obtain a new access token using a valid refresh token. |
| POST | `/api/v1/auth/logout/` | Yes | Blacklist the current refresh token (JWT logout). |
| POST | `/api/v1/auth/password/reset/` | No | Initiate the password reset workflow by sending a reset email. |
| POST | `/api/v1/auth/password/reset/confirm/` | No | Complete password reset using `uidb64`, `token`, and `new_password`. |
| POST | `/api/v1/auth/otp/request/` | No | Request a one-time password for login or verification. Invalidates previous codes and sends a 6-digit code via email. |
| POST | `/api/v1/auth/otp/verify/` | Yes | Verify a one-time password for 2FA or re-authentication. |
| GET | `/api/v1/auth/profile/` | Yes | Retrieve the authenticated user's profile, active subscription, digital licenses, order history, and saved addresses. |
| PUT / PATCH | `/api/v1/auth/profile/update/` | Yes | Update profile attributes (e.g. first_name, last_name, job_or_major, hobbies_or_likings). |
| POST | `/api/v1/auth/password/change/` | Yes | Change password for the authenticated user by providing current and new passwords. |
| GET | `/api/v1/auth/addresses/` | Yes | List all saved physical shipping addresses for the authenticated user. |
| POST | `/api/v1/auth/addresses/` | Yes | Create a new shipping address for the authenticated user (supports `is_default`). |
| GET | `/api/v1/auth/addresses/<id>/` | Yes | Retrieve a specific shipping address owned by the user. |
| PUT | `/api/v1/auth/addresses/<id>/` | Yes | Update all fields of a shipping address owned by the user. |
| PATCH | `/api/v1/auth/addresses/<id>/` | Yes | Partially update a shipping address owned by the user. |
| DELETE | `/api/v1/auth/addresses/<id>/` | Yes | Delete a shipping address owned by the user. |

---

### 4.2 Catalog & Discovery Endpoints (`/api/v1/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/authors/` | No | List all authors with pagination and search. |
| GET | `/api/v1/authors/<id>/` | No | Retrieve complete author biography and published works. |
| GET | `/api/v1/books/` | No | List books with pagination, ordering, and PostgreSQL Full-Text Search (`?search=`). Each book exposes dynamic pricing calculated via `PricingEngine`. |
| GET | `/api/v1/books/<id>/` | No | Retrieve complete book information, including available formats (Print, E-Book, Audio) with live pricing. |
| GET | `/api/v1/books/new/` | No | Retrieve recently published books ordered by creation timestamp. |
| GET | `/api/v1/books/genres/` | No | Retrieve distinct genres present across the book catalog. |

---

### 4.3 Content-Based Recommendation Endpoints (`/api/v1/recommendations/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/recommendations/similar/<int:book_id>/` | No | Retrieve books semantically similar to the specified book based on TF-IDF cosine similarity and taxonomy overlap. |
| GET | `/api/v1/recommendations/for-you/` | Yes* | Retrieve personalized recommendations based on the user's reading history, profile interests, and preferred genres (falls back to trending/popular for guests). |

---

### 4.4 Pricing & VIP Subscription Endpoints (`/api/v1/pricing/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/pricing/plans/` | No | List all active VIP subscription plans (e.g. Gold Tier, Silver Tier). |
| GET | `/api/v1/pricing/subscriptions/` | No | List all active subscription plans (alias for catalog integration). |
| GET | `/api/v1/pricing/subscriptions/me/` | Yes | Retrieve the authenticated user's active and reserved/scheduled subscriptions. |
| POST | `/api/v1/pricing/subscriptions/purchase/` | Yes | Purchase a subscription plan using internal wallet balance (supports `auto_renew`). Schedules if another subscription is active. |
| POST | `/api/v1/pricing/subscriptions/upgrade/` | Yes | Upgrade an active subscription to a higher tier; credits remaining unused value toward the upgrade price. |
| POST | `/api/v1/pricing/subscriptions/cancel/` | Yes | Cancel an active or scheduled subscription; prorates and refunds unused balance back to the user's wallet. |
| POST | `/api/v1/pricing/validate/` | No | Validate a coupon promo code against current cart rules and return discount percentage or amount. |
| GET | `/api/v1/pricing/books/<book_id>/prices/` | No | Retrieve the historical pricing ledger for a book. |
| POST | `/api/v1/pricing/books/<book_id>/prices/` | Yes* | Create a new historical price entry for a book (administrative endpoint). |

---

### 4.5 Publishing & Editorial Endpoints (`/api/v1/publishing/`)

#### Public Publisher Discovery
| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/publishing/public/publishers/` | No | List all active publishers for public storefront browsing. |
| GET | `/api/v1/publishing/public/publishers/<str:id_or_slug>/` | No | Retrieve public profile and published catalog for a publisher by ID or slug. |

#### Publisher Organization & Proposals
| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/publishing/publishers/` | Yes | List publishers in which the authenticated user holds an active staff/editorial membership. |
| GET | `/api/v1/publishing/publishers/<publisher_id>/books/` | Yes | List catalog books associated with the specific publisher organization. |
| GET | `/api/v1/publishing/publishers/<publisher_id>/proposals/` | Yes | List proposals belonging to a publisher (supports `?status=` and `?proposal_type=` filters). |
| GET | `/api/v1/publishing/proposals/<id>/` | Yes | Retrieve publisher-safe details for a specific proposal. |
| POST | `/api/v1/publishing/proposals/book-create/` | Yes | Submit a proposal to publish a new book. |
| POST | `/api/v1/publishing/proposals/book-update/` | Yes | Submit a proposal to modify metadata, formats, or synopsis of an existing book. |
| POST | `/api/v1/publishing/proposals/book-delete/` | Yes | Submit a proposal to delist/delete a book. |
| POST | `/api/v1/publishing/proposals/author-create/` | Yes | Submit an author creation proposal. |
| POST | `/api/v1/publishing/proposals/author-update/` | Yes | Submit an author update proposal. |
| POST | `/api/v1/publishing/proposals/price-change/` | Yes | Submit a price modification proposal for a publisher's book. |
| POST | `/api/v1/publishing/proposals/<id>/withdraw/` | Yes | Withdraw a pending proposal before moderation is completed. |

---

### 4.6 Cart, Orders & Wishlist Endpoints (`/api/v1/cart/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/cart/items/` | No* | Retrieve the current shopping cart with PricingEngine dynamic discounts. |
| POST | `/api/v1/cart/items/` | No* | Add a book format to the cart or adjust quantity. |
| DELETE | `/api/v1/cart/items/` | No* | Remove an item or clear the cart. |
| POST | `/api/v1/cart/merge/` | Yes | Merge an anonymous session cart into the user's persistent database cart upon login. |
| GET | `/api/v1/cart/wishlist/` | Yes | List the authenticated user's wishlist items. |
| POST | `/api/v1/cart/wishlist/` | Yes | Add a book to the user's wishlist. |
| DELETE | `/api/v1/cart/wishlist/<id>/` | Yes | Remove an item from the user's wishlist. |
| POST | `/api/v1/cart/checkout/` | Yes | Execute the order checkout workflow using wallet payment. Creates immutable order snapshots and grants digital licenses. |
| GET | `/api/v1/cart/orders/` | Yes | List the authenticated user's order history. |
| GET | `/api/v1/cart/orders/<id>/` | Yes | Retrieve a complete immutable snapshot of a placed order. |
| POST | `/api/v1/cart/orders/<id>/cancel/` | Yes | Cancel an eligible order, refund funds back to the user's wallet, and revoke digital licenses. |

---

### 4.7 Digital Content & DRM Licensing Endpoints (`/api/v1/content/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/content/licenses/` | Yes | List all active, expired, and revoked digital licenses owned by the authenticated user. |

---

### 4.8 In-App Wallet & Ledger Endpoints (`/api/v1/wallet/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| GET | `/api/v1/wallet/` | Yes | Retrieve the authenticated user's current wallet balance, currency, and account status. |
| GET | `/api/v1/wallet/transactions/` | Yes | List the authenticated user's chronological wallet ledger transactions (deposits, purchases, refunds). |

---

### 4.9 Payment Gateway & Top-up Endpoints (`/api/v1/payments/`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|:---:|-------------|
| POST | `/api/v1/payments/wallet/charge/` | Yes | Initiate an online wallet charge. Generates a gateway payment URL. |
| GET | `/api/v1/payments/callback/` | No | Gateway return URL verifying transaction status and crediting the user's wallet on success. |
| GET | `/api/v1/payments/sep/redirect/<str:gateway_token>/` | No | Gateway redirection endpoint for banking processor settlement. |

## 5. Business Logic

### 5.1 Publisher Proposal Workflow (`ProposalService`)

Publisher changes are coordinated by `ProposalService`, which separates API validation and request handling from the actual business workflow.

The submission path is:

```text
Publisher API Request
      │
      ▼
Submission Serializer
      │
      ▼
ProposalService.submit_*
      │
      ├── Create Proposal
      └── Create Proposal Detail
             │
             ▼
          SUBMITTED
```

Submission methods include:

- `submit_book_create()`
- `submit_book_update()`
- `submit_book_delete()`
- `submit_author_create()`
- `submit_author_update()`
- `submit_price_change()`

Proposal creation is transactional so that a generic Proposal and its detail record are created atomically.

Approval follows the reverse direction:

```text
Submitted Proposal
      │
      ▼
ProposalService.approve()
      │
      ▼
ProposalService.apply()
      │
      ├── Create Book
      ├── Update Book
      ├── Delete Book
      ├── Create Author
      ├── Update Author
      └── Create Historical Price
             │
             ▼
      Mark Proposal APPLIED
```

Rejection is handled by `ProposalService.reject()`, which records the reviewer, timestamp, and rejection reason before transitioning the proposal to `REJECTED`.

Proposal-specific application logic is kept in dedicated handlers so catalog, author, and pricing changes remain separate from generic workflow management.

Proposal withdrawal is handled separately from approval and rejection. A pending proposal may be withdrawn by an authorized active member of its publisher, after which the proposal enters the terminal `WITHDRAWN` state and remains stored for audit history. Withdrawal does not modify the catalog, author, or pricing domain.

### 5.2 Cart Storage Strategy

The application implements a dual-storage strategy to provide a seamless shopping experience for both anonymous and authenticated users.

- **Anonymous users:** Cart contents are stored in the Django session (`request.session["cart"]`).
- **Authenticated users:** Cart contents are persisted in the database using the `Cart` and `CartItem` models.
- **Cart Merge:** After successful authentication, the `POST /api/v1/cart/merge/` endpoint merges the anonymous session cart into the authenticated user's persistent cart. Quantities for duplicate books are summed, after which the session cart is cleared.

This approach allows users to begin shopping before logging in without losing their selections after authentication.

---

### 5.3 Pricing Pipeline (`PricingEngine`)

All pricing decisions are centralized within the `PricingEngine`. Rather than embedding pricing logic throughout the application, every purchasable book passes through the same deterministic pricing pipeline.

```
Current Price
      │
      ▼
Automatic Discount
      │
      ▼
Coupon Discount
      │
      ▼
Subscription Discount
      │
      ▼
Minimum Price Enforcement
      │
      ▼
Final Price
```

The engine performs the following steps:

1. Resolve the currently active historical price.
2. Select the best applicable automatic discount.
3. Validate and apply an optional coupon discount.
4. Apply any eligible subscription discount.
5. Enforce the configured minimum selling price.
6. Return a complete `PricingResult` describing every applied discount and the final selling price.

Pricing rules are completely isolated from the checkout system, allowing the same engine to be reused anywhere book pricing is required.

---

### 5.4 Checkout Workflow (`CheckoutService`)

Checkout is coordinated by the `CheckoutService`, which orchestrates the purchasing workflow while delegating all pricing decisions to the `PricingEngine`.

The checkout process executes the following stages inside a single database transaction:

1. Validate that the customer's cart is not empty.
2. Build an immutable `OrderSnapshot` by calculating the final price of every cart item through the `PricingEngine`.
3. Create the `Order` record using the calculated financial and shipping snapshots.
4. Create immutable `OrderItem` records containing the purchased titles, authors, quantities, and final unit prices.
5. Grant digital licenses for eligible digital books and audiobooks.
6. Consume the applied coupon by incrementing its usage counter.
7. Clear the customer's cart.
8. After the transaction commits successfully, dispatch the order confirmation email as a Celery background task.

Separating checkout orchestration from pricing calculations results in a modular design where pricing policies can evolve independently of the purchasing workflow.

### 5.4.1 Wallet Payment

The current checkout implementation uses the customer's wallet as the payment source. After the final amount is calculated by `PricingEngine`, `CheckoutService` requests an atomic wallet withdrawal. Only after the withdrawal succeeds does the order become `PROCESSING` and continue to order-item creation and license granting. An insufficient wallet balance aborts checkout without creating a completed order or granting digital access.

### 5.4.2 Order Cancellation & Wallet Refund

Customers may cancel orders that are still in a cancellable state through the order API. Cancellation is handled by `CheckoutService.cancel_order()` inside a database transaction. The service:

1. Verifies that the order belongs to the authenticated user.
2. Verifies that the order is cancellable.
3. Credits the original order amount back to the user's wallet and records a refund transaction.
4. Deactivates licenses granted by the order.
5. Transitions the order to `REFUNDED`.

This keeps the financial refund and digital-entitlement rollback in the same transactional workflow.

---

### 5.5 Digital License Management

Digital ownership is represented by persistent `License` records rather than being inferred directly from order history.

After a successful checkout:

- Physical books do not generate licenses.
- Digital books generate perpetual licenses.
- Audiobooks generate perpetual licenses.
- Existing licenses are updated rather than duplicated using `update_or_create()`.

Licenses are created within the checkout transaction, ensuring that successful purchases immediately grant access to protected digital content.

The `License.is_valid()` method serves as the primary authorization check for accessing digital resources throughout the application.

---

### 5.6 User Profile Hub

The `GET /api/v1/auth/profile/` endpoint provides a consolidated overview of the authenticated user's account.

The response includes:

- User profile information.
- Active subscription details.
- All owned digital licenses.
- Complete order history.

This endpoint acts as a centralized dashboard, allowing the frontend to retrieve a user's purchasing and subscription information through a single request.

---

## 6. Authentication & Security

### 6.1 Passwordless Authentication

- **Registration** uses Django's built-in password validation with confirmation (`password` + `password2`).
- **Login** is fully passwordless: users request an OTP via email, then submit the OTP to receive JWT tokens.
- OTP codes are 6-digit numeric, expire after 5 minutes, are single-use, and previous valid codes are invalidated upon requesting a new one.
- The system returns generic messages ("if an account exists…") on the OTP request endpoint to prevent user enumeration.

### 6.2 JWT Implementation

- **Access Token:** 5-minute lifetime for security.
- **Refresh Token:** 7-day lifetime with rotation enabled.
- **Token Blacklisting:** Old refresh tokens are blacklisted upon rotation.
- **Cookie Storage:** Tokens are stored in HTTP-only cookies (`JWT_AUTH_HTTPONLY = True`) to prevent XSS attacks from accessing them via JavaScript.
- **Algorithm:** HS256 with the Django `SECRET_KEY` as the signing key.

### 6.3 Rate Limiting & Abuse Prevention

- Login rate limiting: 5 failed attempts per minute per user/IP (via django-allauth `ACCOUNT_RATE_LIMITS`).
- Minimum price floor ($1.00) prevents discount abuse that would reduce item prices to zero or negative values.
- Discount codes and subscriptions do not stack — only the better discount is applied.
- Inventory/stock checks are not implemented in this phase (assumed unlimited stock).

### 6.4 Permission Model

- **Public endpoints:** Catalog browsing, author listing, subscription plan viewing, discount code validation, and cart operations (anonymous users use session-based cart).
- **Authenticated-only:** Profile viewing, wishlist management, checkout, cart merge, OTP verification.
- **Admin-only:** Administrative moderation and model management are performed through Django Admin. Publisher proposal submission and publisher-scoped read operations are exposed through protected publishing APIs.
- **Default DRF permission:** `IsAuthenticated` (overridden per-view where public access is needed). Publishing endpoints additionally enforce active publisher membership and object-level publisher isolation.

---

### 6.5 Publisher Security Model

The publisher subsystem uses organization membership as the boundary for publisher-side authorization.

- **Publisher members:** Only users with an active `PublisherMembership` may access publisher resources.
- **Inactive memberships:** Inactive memberships cannot access publisher data or submit proposals.
- **Inactive publishers:** Publisher resources are inaccessible when the organization itself is inactive.
- **Cross-publisher isolation:** A member of one publisher cannot list or retrieve proposals belonging to another publisher.
- **Proposal access:** Object-level authorization checks the publisher associated with the proposal rather than trusting a publisher identifier supplied by the client.
- **Role model:** `OWNER`, `MANAGER`, and `EDITOR` roles are currently defined for publisher memberships. The current proposal workflow allows all three roles to participate in publisher proposal submission and viewing; broader organization-management permissions can be introduced separately if required.

Publisher-facing proposal responses intentionally exclude internal moderation information. Administrative review and approval remain restricted to the Django Admin workflow and the centralized `ProposalService`.

### 6.6 Wallet Security & Financial Integrity

- **User isolation:** Wallet detail and transaction history are scoped to the authenticated user.
- **Atomic mutations:** Wallet balance changes and transaction creation occur together inside transactional service methods.
- **Insufficient funds:** Wallet withdrawal is rejected when the available balance is lower than the requested amount.
- **Concurrency protection:** Balance updates use database row locking to avoid lost updates during concurrent wallet operations.
- **Checkout integrity:** Orders are not finalized and digital licenses are not granted when wallet payment fails.
- **Refund integrity:** Order cancellation refunds the wallet and deactivates the associated licenses as one transactional operation.

## 7. Search Implementation

The catalog search functionality is implemented using **PostgreSQL Full-Text Search** through Django's built-in search framework, eliminating the need for external search services while providing efficient relevance-based searching.

### Full-Text Search

The `GET /api/v1/books/` endpoint supports searching through the `?search=` query parameter.

A weighted `SearchVector` is constructed dynamically from multiple fields:

- **Title** — Weight **A** (highest relevance)
- **Description** — Weight **B**
- **Author Name** — Weight **B**

When a search query is supplied:

1. A PostgreSQL `SearchQuery` is created from the user's input.
2. Matching books are filtered using PostgreSQL Full-Text Search.
3. Each result receives a relevance score using `SearchRank`.
4. Results are ordered by descending relevance (`-rank`).

### Filtering

The catalog supports filtering through query parameters:

- `genre`
- `author`
- `is_digital`
- `is_audio`

Multiple filters may be combined within a single request.

### Ordering

When no search query is provided, books are ordered by creation date (newest first).

When a search query is present, results are ordered by PostgreSQL relevance score.

### Pagination

Book listings are paginated using Django REST Framework's pagination system, allowing efficient browsing of large catalogs while keeping API responses lightweight.

---

## 8. Internationalization (i18n)

- **Supported Languages:** English (default), Farsi (Persian)
- **Implementation:** Django's built-in translation framework with `LocaleMiddleware`, custom `locale/` directory, and `LANGUAGES` configuration.
- All user-facing strings in serializers and API responses use `gettext_lazy` with translation markers (`_()`).
- Email subjects use the `[Bookstore]` prefix for brand consistency.

---

## 9. Background Tasks (Celery)

| Task | Schedule | Purpose |
|------|----------|---------|
| `expire_old_otp_codes` | Hourly | Invalidates OTP codes where `expires_at` has passed |
| `process_license_expiry` | Daily | Deactivates licenses where `valid_until` has passed |
| `send_order_confirmation_email` | On-commit (after checkout) | Sends order confirmation email with line-item details, formatted IRR prices, and shipping address |
| `compute_book_similarities` [PHASE 3 — PENDING] | On-demand / scheduled | Offline batch computation of content-based similarity scores between books |
| `generate_user_recommendations` [PHASE 3 — PENDING] | On-demand / scheduled | Generates personalized recommendation sets based on user profile and history |

### 9.1 Email Infrastructure & Gmail SMTP Integration

The backend supports dual-mode email handling configured dynamically via environment variables (`backend/.env`):

- **Development / Fallback Mode:** When `EMAIL_HOST_USER` is not set or empty, Django automatically logs emails to the developer console (`django.core.mail.backends.console.EmailBackend`).
- **Production / Gmail SMTP Mode:** When `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are provided, emails are dispatched via Google's SMTP servers (`smtp.gmail.com:587`, TLS enabled).
- **Synchronous Dev Execution (`CELERY_TASK_ALWAYS_EAGER=True`):** In local development without an active Celery worker or Redis broker daemon, background tasks such as `send_order_confirmation_email` execute immediately and synchronously inside the request/checkout lifecycle, ensuring email delivery happens without requiring background queue daemons.

#### Gmail SMTP Setup Guide

To use a personal or business Gmail account with the bookstore backend:

1. **Enable 2-Step Verification:** Go to your [Google Account Security Settings](https://myaccount.google.com/security) and activate 2-Step Verification.
2. **Generate an App Password:**
   - Navigate to [Google App Passwords](https://myaccount.google.com/apppasswords).
   - Enter `Bookstore` as the application name and click **Create**.
   - Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
3. **Configure `backend/.env`:**
   ```bash
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_USE_SSL=False
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_16_character_app_password
   DEFAULT_FROM_EMAIL="Bookstore <your_email@gmail.com>"
   ```

#### Testing Email Configuration

A dedicated management command is available to verify SMTP authentication and email delivery:

```bash
# Test with a specific recipient:
python manage.py send_test_email recipient@example.com

# Default test (uses EMAIL_HOST_USER):
python manage.py send_test_email
```

The command verifies connection parameters, prints active configuration diagnostics, and sends a test email containing both plain-text and HTML formatting.

#### Email Templates & Content Presentation

- **Order Confirmation (`templates/email/order_confirmation.html`):**
  - Displays customer name, order ID, order status, and formatted purchase date.
  - Itemized table with title, author, format type (Physical, E-book, Audiobook), quantity, unit price, and subtotal.
  - All monetary values are presented in Iranian Rial (`IRR`) formatted with comma separators (e.g. `250,000 IRR`).
  - Conditional shipping section: displays recipient name, street address, and city for physical deliveries; displays instant digital activation notice for digital purchases.
  - Dual-mode email structure: sends rich HTML email with plain-text fallback (`strip_tags`).
- **OTP Verification (`templates/email/otp_code.html`):**
  - Displays branded verification email with a prominent 6-digit verification code badge, expiration notice (5 minutes), and security advisory.

---

## 10. Development Practices

### 10.1 Git Workflow

The team follows a **simplified Gitflow** branching model:

- `main`: Stable production-ready code. Never committed to directly.
- `develop`: Integration branch for approved features. Never committed to directly.
- `feat/<description>`: Feature branches branched off `develop`.
- `fix/<description>`: Bug fix branches branched off `develop`.

For features spanning both backend and frontend, the team defines the API contract (endpoint URL + JSON schema) first, then develops in parallel on separate feature branches. Backend developers test APIs using Postman/Insomnia; frontend developers use mock data. Integration occurs after both PRs are approved and merged into `develop`.

### 10.2 Commit Convention

All commits use the **Conventional Commits** format:
<type>(<scope>): <description>

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`  
Scope: `backend`, `frontend`, or specific app name  
Commits are atomic, use imperative mood, and describe one logical change each.

### 10.3 Testing Strategy

- Tests are written using Django's `TestCase` framework and `APITestCase` from DRF.
- The publishing subsystem includes dedicated API and workflow coverage for proposal submission, approval, rejection, authorization, and cross-publisher isolation.
- The wallet subsystem includes service and API coverage for automatic wallet creation, balance mutations, insufficient-funds handling, transaction history, wallet isolation, wallet-backed checkout, and order cancellation/refund behavior.
- After completing or updating each `views.py`, comprehensive tests were generated and refined with AI assistance to cover:
  - All endpoint functionality (GET, POST, DELETE)
  - Edge cases (empty cart, invalid IDs, duplicate wishlist items)
  - Cross-app integration (checkout flow from cart through pricing to license generation)
  - Payment and refund integration (wallet withdrawal during checkout, insufficient funds, order cancellation, wallet refund, and license revocation)
  - Address management and shipping integration (Address model CRUD, default address handling, physical vs. digital checkout shipping enforcement, and address snapshot creation)
  - Publisher workflow lifecycle (including proposal withdrawal and publisher isolation)
  - Authentication requirements (public vs. authenticated access)
  - Discount logic (subscription, promo codes, anti-stacking behavior)
- All tests pass before merging to `develop`.

### 10.4 Demo Data & Catalog Management Commands

The platform provides two dedicated Django management commands for seeding and populating data:

1. **`python manage.py generate_demo_data`**:
   - Generates the base development environment: creates demo users, addresses, wallets, subscription plans, default discounts, and baseline catalog items.

2. **`python manage.py populate_realistic_catalog`**:
   - Upgrades the store catalog to an authentic Iranian bookstore lineup:
     - Safely purges existing books, formats, authors, publishers, moderation proposals, and dependent order histories while preserving user accounts, addresses, and wallets.
     - Seeds **10 authentic Iranian publishers** (نشر افق, انتشارات پرتقال, آوانامه, انتشارات نسل نو اندیش, انتشارات نگاه, نشر چشمه, ماه‌آوا, انتشارات خیلی سبز, نشر نون, نشر روزنه) with verified slugs matching frontend components.
     - Seeds **24 prominent Persian & international authors** with detailed biographies.
     - Populates **50 authentic, iconic books** across all 6 platform genres (Fiction, Sci-Fi, History, Science, Tech, Business) with authentic ISBNs, Persian descriptions, and local cover artwork from `/images/`.
     - Configures available formats (Physical, E-book with `/k2.pdf`, Audiobook with `/sample-audio.wav`) and realistic pricing in Iranian Rial (`IRR`).
     - Links all books to publishers via applied proposals, sets up sample pending/approved moderation proposals, and grants superusers owner privileges in the primary publisher.
     - Generates realistic completed customer orders, active digital licenses, wishlists, and active shopping carts.

---

## 11. Phase 3 — Recommendation System & Social Media (Designed & Planned)

### 11.1 Design Philosophy & Constraints

The recommendation system is designed as a **foundational intelligence layer** rather than a production-scale system. The objective is to implement a robust, explainable backbone while clearly defining extensibility paths for future development.

**Design Constraints:**

- **Offline processing only** — no real-time computation during user requests
- **No external AI APIs** — all processing self-contained within the Django ecosystem
- **No large models** — lightweight, rule-based and statistical approaches
- **Proof-of-concept quality** with production-aware design
- **English-only** for semantic processing (platform remains bilingual at the data level)
- **No new infrastructure** unless strictly necessary — leverages existing Django, PostgreSQL, and Celery stack

### 11.2 Catalog Schema Redesign

The existing Phase 1/2 catalog models are insufficient for semantic reasoning. The redesigned schema (detailed in Section 3.2) introduces:

- **Genre model** — controlled categorical taxonomy replacing the flat `genre` CharField
- **Tag model** — fine-grained thematic signals for overlap detection
- **Normalized fields** — `normalized_name` on Author, Genre, and Tag for deduplication
- **Language field** on Book — mandatory ISO code, enabling language-based filtering
- **Clear separation** of semantic fields (description, genres, tags, language) from commerce fields (prices, file paths, flags)

These changes are documented with `[PHASE 3 — PENDING]` flags on all affected fields in Section 3.2.

### 11.3 Content-Based Recommendation Engine

**Processing Pipeline (Planned):**

1. **Semantic Eligibility Filter:** Select only books where `language = 'en'`, `description` is non-empty, and at least one `genre` exists.
2. **Feature Extraction:** Construct a combined text representation from:
   - `description` (primary signal, highest weight)
   - `genre` names (moderate weight)
   - `tag` names (explicit overlap signal)
   - Author biography (weak supplementary signal)
3. **Similarity Computation:** Calculate pairwise book similarity using lightweight statistical methods (TF-IDF + cosine similarity or Jaccard overlap for tags/genres).
4. **Storage:** Store pre-computed similarity scores in a dedicated database table for fast retrieval.
5. **Serving:** Expose via `GET /api/v1/recommendations/<book_id>/` — returns top-N similar books with explanations (e.g., "Similar genres: Science Fiction", "Shared tags: artificial intelligence, ethics").

**Personalized Recommendations (Planned):**

- Leverage `User.job_or_major` and `User.hobbies_or_likings` as seed signals
- Combine with purchase history (digital licenses owned) and wishlist items
- Weight recent interactions higher than older ones
- Expose via `GET /api/v1/recommendations/user/`

**Recalculation Strategy:**

- Primary trigger: new books added to the catalog
- Secondary trigger: significant description edits (rare)
- Execution: Celery Beat scheduled task or manually triggered
- Consistency model: eventually consistent (not real-time)

### 11.4 Demonstration Dataset

A curated dataset is planned with the following characteristics:

| Dimension | Target |
|-----------|--------|
| Authors | 6–10 |
| Books | 25–40 |
| Genres | 5–8 (broad, controlled) |
| Tags | 30–60 (specific, reusable) |

**Dataset Design Principles:**

- Intentional semantic overlap (books that should be similar)
- Intentional contrast (books that should not be similar)
- Multiple books per author (including cross-genre cases)
- Different authors writing on similar themes
- Edge cases: broad/vague descriptions, overlapping tags across domains
- 2+ non-English books included to validate language exclusion logic

**Validation Criteria:**

Before recommendation computation begins, the dataset must satisfy:
- Every English book has a description, ≥1 genre, and ≥3 tags
- Overlap exists across genres, tags, and authors
- Negative examples are present and verifiable
- A human can explain why Book A is similar to Book B, and why Book C is not

### 11.5 Social Media Layer (Designed as Proof of Concept)

The social media component extends the platform beyond e-commerce into community engagement, while maintaining the bookstore's identity through strict topic anchoring and layered moderation.

**Core Principle: Topic-Anchored Discussion**

Unlike general-purpose social platforms, every post on the Bookstore social layer must be explicitly connected to the literary domain:

- **Book/Author Tagging:** Each original post must be tagged with a specific book or author. This ensures all content remains relevant to the platform's purpose.
- **Response Inheritance:** Replies and responses inherit the parent post's tags automatically. This preserves topical coherence throughout discussion threads without requiring explicit tagging on every reply.

This constraint prevents the platform from devolving into a generic social feed and maintains focus on books and authors as the central organizing principle.

**Multi-Level Moderation Pipeline**

To maintain content quality and platform safety without requiring a large human moderation team, a three-tier automated moderation system is planned:

| Level | Timing | Mechanism | Purpose |
|-------|--------|-----------|---------|
| **Level 0** | At creation | Structural enforcement | Posts must reference a valid book or author (via tagging) or be a response to an existing tagged post. Non-compliant posts are rejected at submission. |
| **Level 1** | Immediately after posting | ML-based content evaluation | A machine learning model scans each post upon submission, classifying it as spam, harmful, irrelevant (off-topic despite tag), or acceptable. Flagged posts enter a review queue; clean posts appear immediately. |
| **Level 2** | Periodic & randomized | Retrospective sampling | A scheduled task periodically samples published posts and their response chains, re-evaluating them for content that may have evaded Level 1 detection. This catches evolving patterns, coordinated abuse, and edge cases. |

**Design Rationale:**

- Level 0 is deterministic and rule-based — zero false positives for structural issues.
- Level 1 provides real-time protection without human latency.
- Level 2 acts as a safety net, acknowledging that no automated system is perfect on first pass.
- The multi-level design is itself a research contribution: it demonstrates understanding of content moderation as a layered defense rather than a single filter.

**Author & Publisher Promotion**

A dedicated promotional channel allows authors and publishers to advertise their products within the platform, governed by stricter rules than general user posts:

- **Verified Accounts:** Authors and publishers receive verified status, distinguishing official communications from user-generated content.
- **Targeted Delivery:** Promotional posts are shown preferentially to users whose reading history, wishlist, or browsing behavior indicates interest in the relevant genre, author, or publisher. This prevents the social feed from becoming a generic advertising space.
- **Subtlety Requirement:** Advertisements must be informational and contextually relevant, not aggressive sales pitches. The platform's intent is to connect interested readers with relevant content, not to replicate marketplace dynamics within the social layer.
- **Enhanced Moderation:** Promotional content passes through the same Level 1 and Level 2 moderation pipeline but with stricter classification thresholds, given the higher risk of spam and the platform's commitment to maintaining user trust.

**Alignment with Recommendation Engine:**

The social layer and the content-based recommendation system (Section 11.3) are designed to complement each other:
- User posts about books provide implicit preference signals that can strengthen recommendation accuracy.
- Recommendations can surface books that are actively being discussed, creating a feedback loop between community activity and discovery.
- Author/publisher promotions reach users who already show algorithmic affinity for that content, improving relevance and reducing perceived intrusiveness.

**Implementation Status:**

All social media features are documented as proof of concept and planned for future development. The moderation pipeline architecture, topic-anchoring design, and promotional framework are fully specified and ready for implementation when development resources permit. These designs serve to demonstrate architectural foresight and an understanding of content platform challenges beyond basic CRUD functionality.

---

## 12. API Contract Summary

### Authentication Header
Authorization: Bearer <access_token>

### Core API Routes

| Resource | Base Path |
|----------|-----------|
| Authentication | `/api/v1/auth/` |
| Authors | `/api/v1/authors/` |
| Books | `/api/v1/books/` |
| Pricing & Subscriptions | `/api/v1/pricing/` |
| Cart & Checkout | `/api/v1/cart/` |
| Publishing | `/api/v1/publishing/` |
| Wallet | `/api/v1/wallet/` |
| Recommendations [PHASE 3 — PENDING] | `/api/v1/recommendations/` |

### Response Format

All API responses are in JSON format. Successful responses return HTTP 200/201/204. Errors return appropriate 4xx/5xx status codes with a `detail` field containing the error message (internationalized).

---

**End of Backend Documentation**
