# AgentPay Skill

Financial freedom for AI agents. Deposit USDC, spend anywhere.

## Overview

AgentPay enables AI agents to make real-world purchases using USDC. Agents can create virtual Visa cards, buy gift cards, and pay for APIs - all without human intervention.

**Use cases:**
- Agent buys AWS credits to spin up infrastructure
- Agent purchases gift cards for user rewards
- Agent pays for API subscriptions (OpenAI, Anthropic, etc.)
- Agent orders physical goods via Amazon gift cards

## Stack (Opinionated)

| Layer | Tool | Why |
|-------|------|-----|
| Card Issuing | Reloadly API | Global gift cards, API-first, no KYC for agents |
| USDC→Fiat | Circle USDC | Native stablecoin, widest support |
| Wallet | Safe Smart Account | Programmable, multi-sig capable |
| Execution | OpenClaw | Agent orchestration |

**Why Reloadly over GnosisPay?**
GnosisPay requires KYC for card issuance. Reloadly allows gift card purchases via API - perfect for agent autonomy.

## Procedure

### 1. Classify

What does the agent need?

| Request Type | Action |
|--------------|--------|
| "Buy X on Amazon" | Gift card → Amazon |
| "Pay for API" | Gift card → Prepaid Visa |
| "Check balance" | Query wallet |
| "Fund wallet" | Deposit USDC |

### 2. Pick

Select the right script:

| Task | Script |
|------|--------|
| Check USDC balance | `scripts/check_balance.ts` |
| Buy gift card | `scripts/buy_giftcard.ts` |
| List available products | `scripts/list_products.ts` |
| Check order status | `scripts/order_status.ts` |

### 3. Implement

Run the appropriate script with parameters:

```bash
# Check balance
npx ts-node scripts/check_balance.ts --chain base-sepolia

# Buy Amazon gift card
npx ts-node scripts/buy_giftcard.ts \
  --product amazon_us \
  --amount 25 \
  --recipient agent@example.com

# List available gift cards for a country
npx ts-node scripts/list_products.ts --country US
```

### 4. Test

Always use testnet/sandbox:
- Reloadly sandbox: `https://giftcards-sandbox.reloadly.com`
- USDC testnet: Sepolia, Base Sepolia
- See `references/testing.md` for test credentials

### 5. Deliver

Confirm to user with:
- Transaction hash (USDC transfer)
- Gift card code (if applicable)
- Order ID for tracking

## Security Notes

⚠️ **CRITICAL** - Read `references/security.md` before any transaction:
- Never log gift card codes in plain text
- Rate limit purchases (max $100/day default)
- Require confirmation for amounts > $50
- Store credentials in environment variables only

## Quick Start

```bash
# 1. Set environment
export RELOADLY_CLIENT_ID=xxx
export RELOADLY_CLIENT_SECRET=xxx
export PRIVATE_KEY=xxx

# 2. Check balance
npx ts-node scripts/check_balance.ts --chain base-sepolia

# 3. Buy a gift card (sandbox)
npx ts-node scripts/buy_giftcard.ts \
  --product amazon_us \
  --amount 10 \
  --sandbox
```

## Supported Products

| Category | Examples |
|----------|----------|
| E-commerce | Amazon, eBay, Walmart |
| Cloud/API | AWS, Google Cloud, DigitalOcean |
| Entertainment | Netflix, Spotify, Steam |
| Prepaid Cards | Visa, Mastercard (select regions) |

Full catalog: `scripts/list_products.ts --country US`

## References

- `references/reloadly.md` - API integration details
- `references/security.md` - Security checklist
- `references/testing.md` - Sandbox testing guide

## Flow Diagram

```
User: "Buy me $25 Amazon gift card"
           │
           ▼
    ┌─────────────┐
    │  AgentPay   │
    │   Skill     │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Check USDC  │──► Insufficient? → "Need to deposit USDC"
    │   Balance   │
    └─────────────┘
           │ OK
           ▼
    ┌─────────────┐
    │  Reloadly   │
    │    API      │
    └─────────────┘
           │
           ▼
    ┌─────────────┐
    │ Gift Card   │──► Code: XXXX-YYYY-ZZZZ
    │  Delivered  │
    └─────────────┘
           │
           ▼
    Agent: "Done! Your Amazon gift card: XXXX-YYYY-ZZZZ"
```

---

Built for agents that need to spend. 🦞
