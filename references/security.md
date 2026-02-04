# Security Checklist for AgentPay

## Before ANY Transaction

- [ ] Verify wallet has sufficient USDC balance
- [ ] Confirm amount is within daily limit ($100 default)
- [ ] Check recipient/product is valid
- [ ] Use sandbox for testing, NEVER production with real funds during development

## Credential Storage

**DO:**
```bash
# Environment variables
export RELOADLY_CLIENT_ID=xxx
export RELOADLY_CLIENT_SECRET=xxx
export PRIVATE_KEY=xxx
```

**DON'T:**
```typescript
// NEVER hardcode credentials
const apiKey = "sk_live_xxxxx"; // ❌ NO
```

## Rate Limits

| Action | Limit | Rationale |
|--------|-------|-----------|
| Gift card purchase | $100/day | Prevent runaway spending |
| Single transaction | $50 max | Require confirmation above |
| API calls | 100/hour | Reloadly rate limit |

## Confirmation Required

For amounts > $50, agent MUST confirm with user:

```
Agent: "I'm about to purchase a $75 Amazon gift card. Confirm? (yes/no)"
User: "yes"
Agent: [proceeds]
```

## Sensitive Data Handling

### Gift Card Codes

```typescript
// ❌ WRONG - logs code in plain text
console.log(`Gift card code: ${code}`);

// ✅ RIGHT - mask code in logs
console.log(`Gift card code: ${code.slice(0, 4)}****`);

// ✅ RIGHT - send directly to user, don't store
await sendToUser(userId, `Your code: ${code}`);
```

### Transaction Logs

Log these:
- Timestamp
- Amount
- Product type
- Order ID
- Status (success/fail)

DON'T log:
- Full gift card codes
- Private keys
- API secrets
- User PII

## Error Handling

```typescript
try {
  const result = await buyGiftCard(params);
} catch (error) {
  // Log sanitized error
  console.error(`Purchase failed: ${error.code}`);
  
  // DON'T expose internal errors to user
  // ❌ throw error;
  
  // ✅ Return user-friendly message
  return { success: false, message: "Purchase failed. Please try again." };
}
```

## Audit Trail

Keep immutable record of:
1. All purchase attempts (success and fail)
2. Balance checks
3. Confirmation flows
4. Error events

Store in append-only log:
```
/data/workspace/skills/agentpay/logs/transactions.jsonl
```

## Emergency Stop

If suspicious activity detected:
1. Immediately disable API credentials
2. Alert owner via configured channel
3. Preserve all logs for investigation

```typescript
if (dailySpend > DAILY_LIMIT * 2) {
  await disableAgent();
  await alertOwner("Suspicious spending detected");
}
```

## Testnet vs Mainnet

| Environment | USDC Contract | Reloadly |
|-------------|---------------|----------|
| Development | Sepolia testnet | Sandbox API |
| Staging | Base Sepolia | Sandbox API |
| Production | Base mainnet | Production API |

**NEVER mix testnet keys with production API or vice versa.**

---

Security is non-negotiable. When in doubt, don't proceed.
