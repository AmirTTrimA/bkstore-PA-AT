# Payments App

The payments app handles external payment gateway integrations and wallet top-up operations.

Currently supported payment gateway:

- SEP (Saman Bank)

The app is designed around a gateway abstraction layer so additional payment providers can be added without changing the payment flow logic.

---

# Payment Flow

The wallet top-up flow works as follows:

1. User requests a wallet charge from the backend.
2. Backend creates a pending `Payment` record.
3. Backend requests a payment token from the configured gateway.
4. Backend returns the payment URL to the frontend.
5. Frontend redirects the user to the payment gateway.
6. User completes the payment on the gateway page.
7. Gateway sends a callback request to the backend.
8. Backend verifies the transaction with the gateway.
9. Wallet balance is updated.
10. User is redirected to the frontend payment result page.

```
Frontend
   |
   | POST /wallet/charge/
   v
Backend
   |
   | Request token
   v
SEP Gateway
   |
   | Payment completed
   v
Backend Callback
   |
   | Verify transaction
   v
Wallet Deposit
   |
   v
Frontend Result Page
```

---

# API Endpoints

## Create Wallet Charge

Creates a new wallet payment request.

### Request

```
POST /api/v1/payments/wallet/charge/
```

Authentication:

```
Authorization: Bearer <access_token>
```

Content-Type:

```
application/json
```

Body:

```json
{
    "amount": 500000
}
```

Example response:

```json
{
    "payment_url": "https://gateway.example.com/payment?Token=...",
    "token": "gateway_token"
}
```

The frontend should redirect the user to the returned `payment_url`.

Example:

```javascript
window.location.href = payment_url;
```

---

## Payment Callback

This endpoint is called by the payment gateway after the user completes the payment.

### Endpoint

```
POST /api/v1/payments/callback/
```

This endpoint should **not** be called by the frontend.

The backend is responsible for:

- validating callback data
- finding the related payment
- verifying the transaction
- updating payment status
- depositing wallet balance

---

# Payment Statuses

Payments have the following states:

| Status | Description |
|---|---|
| Pending | Payment created but not verified |
| Success | Payment verified and wallet updated |
| Failed | Payment failed or verification rejected |

---

# Gateway Architecture

The payment system uses a gateway abstraction.

Structure:

```
payments/
|
├── services/
│   ├── base.py
│   ├── factory.py
│   └── sep.py
|
├── api/
│   ├── views.py
│   └── urls.py
|
└── models.py
```

## Base Gateway

`base.py`

Defines the common interface for payment providers.

New gateways should implement the same interface.

---

## Gateway Factory

`factory.py`

Selects the configured payment provider.

Example:

```env
PAYMENT_GATEWAY=SEP
```

---

## SEP Gateway

`sep.py`

Implementation of the Saman Bank payment gateway.

Handles:

- token generation
- payment redirect URL creation
- transaction verification

---

# Environment Variables

Required payment configuration:

```env
# Payment Gateway
PAYMENT_GATEWAY=SEP

# SEP Configuration
SEP_TERMINAL_ID=
SEP_TOKEN_URL=
SEP_PAYMENT_URL=
SEP_VERIFY_URL=

# Frontend redirect after payment
PAYMENT_RESULT_URL=http://localhost:3000/payment/result
```

---

# Frontend Integration Guide

Frontend responsibilities:

1. Send wallet charge request.
2. Receive `payment_url`.
3. Redirect the user to the payment URL.
4. Handle the final payment result page.

Example flow:

```
User clicks "Charge Wallet"

        |
        v

POST /api/v1/payments/wallet/charge/

        |
        v

Receive payment_url

        |
        v

Redirect user to gateway

        |
        v

Payment completed

        |
        v

Backend redirects:

/payment/result?status=success

or

/payment/result?status=failed
```

Frontend should implement:

```
/payment/result?status=success
/payment/result?status=failed
```

---

# Local Development

Payment gateways require a publicly reachable callback URL.

A local Django server:

```
http://localhost:8000
```

cannot receive callbacks from external payment providers.

During development, use a tunneling service.

Example using localhost.run:

```bash
ssh -R 80:localhost:8000 nokey@localhost.run
```

The generated public URL should be used as the callback base URL.

Example:

```
https://example.lhr.life/api/v1/payments/callback/
```

Production deployments should use:

- public server
- domain name
- HTTPS certificate

---

# Testing

Run payment tests:

```bash
python manage.py test payments
```

The test suite covers:

- creating wallet payments
- authentication requirements
- successful verification
- failed callbacks
- duplicate verification protection
- wallet deposit behavior

---

# Security Notes

- The callback endpoint must never trust frontend data.
- Payment verification must always be performed with the gateway.
- Wallet balance updates should only happen after successful verification.
- Gateway tokens and credentials should never be exposed to frontend clients.
- Production logs should not contain payment credentials or sensitive gateway data.