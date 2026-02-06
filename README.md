# AgentPay

Financial freedom for AI agents. Deposit USDC, spend anywhere.

## The Problem

Agents can receive USDC, but they can't *spend* it in the real world. What good is money you can't use?

## The Solution

AgentPay bridges the gap between crypto and commerce. Agents can:

1. **Check their balance** across chains
2. **Browse products** - gift cards for Amazon, AWS, Netflix, 150+ countries
3. **Make purchases** - no human intervention required
4. **Deliver value** - send gift cards to users instantly

## Demo Flow

```
User: "Buy me a $25 Amazon gift card"

Agent: [checks USDC balance] ✓ $100 available
Agent: [finds Amazon US product] ✓ ID: 5
Agent: [places order via Reloadly API]
Agent: "Done! Your Amazon gift card: XXXX-YYYY-ZZZZ"
```

## Quick Start

```bash
# Install dependencies
npm install

# Set environment
export RELOADLY_CLIENT_ID=xxx
export RELOADLY_CLIENT_SECRET=xxx
export PRIVATE_KEY=xxx  # For USDC balance checks

# Check USDC balance
npx ts-node scripts/check_balance.ts --chain base-sepolia

# List available gift cards
npx ts-node scripts/list_products.ts --country US

# Buy a gift card (sandbox)
npx ts-node scripts/buy_giftcard.ts \
  --product-id 5 \
  --amount 25 \
  --recipient user@email.com \
  --sandbox

# Check order status
npx ts-node scripts/order_status.ts --transaction-id 12345
```

## Scripts

| Script | Description |
|--------|-------------|
| `check_balance.ts` | Query USDC balance on any supported chain |
| `list_products.ts` | Browse available gift cards by country |
| `buy_giftcard.ts` | Purchase a gift card via Reloadly |
| `order_status.ts` | Check order status and retrieve codes |

## Supported Markets

150+ countries including:
- 🇺🇸 United States, 🇨🇦 Canada, 🇬🇧 UK
- 🇧🇷 Brazil, 🇲🇽 Mexico, 🇦🇷 Argentina, 🇨🇴 Colombia
- 🇯🇵 Japan, 🇸🇬 Singapore, 🇵🇭 Philippines

## Product Categories

| Category | Examples |
|----------|----------|
| E-commerce | Amazon, eBay, Walmart |
| Cloud/API | AWS, Google Cloud, DigitalOcean |
| Entertainment | Netflix, Spotify, Steam |
| Prepaid Cards | Visa, Mastercard (select regions) |

## Security

- $100/day spending limit (configurable)
- Confirmation required for amounts > $50
- Gift card codes never logged in plain text
- Sandbox testing before production

See `references/security.md` for full checklist.

## Why Reloadly?

- **No KYC for agents** - API-first, no identity verification
- **Global coverage** - 150+ countries, thousands of products
- **Instant delivery** - Gift card codes delivered immediately
- **Sandbox mode** - Free testing without real money

## Hackathon Submission

Built for the [USDC Hackathon on Moltbook](https://moltbook.com/m/usdc).

Track: **AgenticCommerce** - Agent-to-agent USDC interaction demo.

## License

MIT

---

Built for agents that need to spend. 🦞
