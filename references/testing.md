# Testing AgentPay

## Environment Setup

### 1. Get Reloadly Sandbox Credentials

1. Sign up at https://www.reloadly.com/developers
2. Go to Dashboard → API Settings
3. Toggle "Sandbox Mode"
4. Copy Client ID and Client Secret

### 2. Set Environment Variables

```bash
export RELOADLY_CLIENT_ID="your_sandbox_client_id"
export RELOADLY_CLIENT_SECRET="your_sandbox_client_secret"
export RELOADLY_SANDBOX=true

# For USDC balance checks
export PRIVATE_KEY="your_testnet_private_key"
```

### 3. Get Testnet USDC

**Base Sepolia:**
- Faucet: https://www.circle.com/en/usdc-multichain/base
- Contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**Ethereum Sepolia:**
- Faucet: https://faucet.circle.com
- Contract: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

## Test Scenarios

### Scenario 1: Check Balance

```bash
npx ts-node scripts/check_balance.ts --chain base-sepolia
```

Expected:
```
Wallet: 0x...
Chain: Base Sepolia
USDC Balance: 100.00
```

### Scenario 2: List Products

```bash
npx ts-node scripts/list_products.ts --country US --limit 5
```

Expected:
```
Available gift cards in US:
1. Amazon USA ($1 - $500)
2. Steam USA ($5 - $100)
3. Netflix USA ($15 - $100)
...
```

### Scenario 3: Buy Gift Card (Sandbox)

```bash
npx ts-node scripts/buy_giftcard.ts \
  --product-id 123 \
  --amount 25 \
  --recipient test@example.com \
  --sandbox
```

Expected:
```
Order placed successfully!
Transaction ID: 12345
Product: Amazon USA
Amount: $25.00
Status: SUCCESSFUL
Gift Card Code: SANDBOX-XXXX-XXXX
```

### Scenario 4: Insufficient Balance

```bash
npx ts-node scripts/buy_giftcard.ts \
  --product-id 123 \
  --amount 1000 \
  --sandbox
```

Expected:
```
Error: Insufficient USDC balance
Required: $1000.00
Available: $100.00
```

### Scenario 5: Rate Limit

Make 101 requests in quick succession.

Expected:
```
Error: Rate limited. Retry after 60 seconds.
```

## Manual Testing Checklist

- [ ] Auth token obtained successfully
- [ ] Products list returns data
- [ ] Product details by ID works
- [ ] Sandbox order succeeds
- [ ] Gift card code retrieved
- [ ] Error handling works (bad product ID)
- [ ] Rate limit handling works
- [ ] Balance check on multiple chains

## Integration Test

Full flow test:

```typescript
// test/integration.test.ts
describe('AgentPay Integration', () => {
  it('should complete purchase flow', async () => {
    // 1. Check balance
    const balance = await checkBalance('base-sepolia');
    expect(balance).toBeGreaterThan(0);
    
    // 2. List products
    const products = await listProducts('US');
    expect(products.length).toBeGreaterThan(0);
    
    // 3. Buy gift card (sandbox)
    const order = await buyGiftCard({
      productId: products[0].productId,
      amount: 10,
      recipient: 'test@example.com',
      sandbox: true
    });
    expect(order.status).toBe('SUCCESSFUL');
    
    // 4. Get gift card code
    const card = await getGiftCardCode(order.transactionId);
    expect(card.cardNumber).toBeDefined();
  });
});
```

Run:
```bash
npx jest test/integration.test.ts
```

## Debugging

### Enable verbose logging

```bash
export DEBUG=agentpay:*
npx ts-node scripts/buy_giftcard.ts ...
```

### Check API response

```bash
curl -v -H "Authorization: Bearer $TOKEN" \
  https://giftcards-sandbox.reloadly.com/products?countryCode=US
```

### Common issues

| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Token expired | Refresh token |
| 402 Payment Required | Reloadly balance low | Fund account |
| Empty products | Wrong country code | Check ISO code |
| Slow response | Rate limited | Add delay |

---

Always test in sandbox before any production use.
