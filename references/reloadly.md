# Reloadly API Integration

## Overview

Reloadly is a global gift card and mobile top-up platform with API access. Perfect for agent purchases.

**Base URLs:**
- Production: `https://giftcards.reloadly.com`
- Sandbox: `https://giftcards-sandbox.reloadly.com`

**Auth URL:** `https://auth.reloadly.com/oauth/token`

## Authentication

```typescript
const getAccessToken = async () => {
  const response = await fetch('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.RELOADLY_CLIENT_ID,
      client_secret: process.env.RELOADLY_CLIENT_SECRET,
      grant_type: 'client_credentials',
      audience: 'https://giftcards-sandbox.reloadly.com' // or production URL
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

## Key Endpoints

### List Products

```
GET /products?countryCode=US&size=50
```

Response:
```json
{
  "content": [
    {
      "productId": 123,
      "productName": "Amazon USA",
      "brand": { "brandName": "Amazon" },
      "country": { "isoName": "US" },
      "denominationType": "RANGE",
      "minRecipientDenomination": 1,
      "maxRecipientDenomination": 500,
      "senderCurrencyCode": "USD"
    }
  ]
}
```

### Get Product by ID

```
GET /products/{productId}
```

### Order Gift Card

```
POST /orders
```

Body:
```json
{
  "productId": 123,
  "quantity": 1,
  "unitPrice": 25,
  "customIdentifier": "agent-order-001",
  "recipientEmail": "recipient@example.com",
  "recipientPhone": {
    "countryCode": "US",
    "phoneNumber": "1234567890"
  }
}
```

Response:
```json
{
  "transactionId": 12345,
  "status": "SUCCESSFUL",
  "product": { "productName": "Amazon USA" },
  "smsFee": 0,
  "recipientEmail": "recipient@example.com",
  "customIdentifier": "agent-order-001"
}
```

### Redeem Instructions

```
GET /orders/transactions/{transactionId}/cards
```

Response:
```json
[
  {
    "cardNumber": "XXXX-YYYY-ZZZZ-WWWW",
    "pinCode": "1234"
  }
]
```

## Supported Countries (Sample)

| Country | Code | Popular Products |
|---------|------|------------------|
| United States | US | Amazon, Visa, Steam, Netflix |
| United Kingdom | GB | Amazon UK, Uber, PlayStation |
| Brazil | BR | Amazon BR, Uber, iFood |
| Mexico | MX | Amazon MX, Uber, Steam |
| Colombia | CO | Rappi, Uber, PlayStation |
| Argentina | AR | Mercado Pago, Steam, Uber |

Full list: 150+ countries

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad request | Check parameters |
| 401 | Unauthorized | Refresh token |
| 402 | Insufficient balance | Top up Reloadly account |
| 404 | Product not found | Check product ID |
| 429 | Rate limited | Wait and retry |
| 500 | Server error | Retry with backoff |

## Sandbox Testing

Sandbox mode returns simulated gift cards. Use for development.

**Sandbox credentials:** Sign up at https://www.reloadly.com/developers

**Test scenarios:**
- Successful order: Any valid product
- Failed order: Use `unitPrice: -1`

## Pricing

Reloadly charges a small margin on gift cards (typically 1-5% depending on product).

Agent needs Reloadly account with balance to purchase. Fund via:
- Credit card
- Bank transfer
- Crypto (via partner)

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Auth | 100/hour |
| Products | 1000/hour |
| Orders | 100/hour |

---

Docs: https://developers.reloadly.com
