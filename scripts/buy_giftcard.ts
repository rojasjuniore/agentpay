/**
 * Buy a gift card via Reloadly API
 * 
 * Usage:
 *   npx ts-node buy_giftcard.ts --product-id 123 --amount 25 --recipient user@email.com
 *   npx ts-node buy_giftcard.ts --product-id 123 --amount 25 --sandbox
 */

import { parseArgs } from 'util';
import { randomUUID } from 'crypto';

const SANDBOX_URL = 'https://giftcards-sandbox.reloadly.com';
const PROD_URL = 'https://giftcards.reloadly.com';

// Daily spending limit for safety
const DAILY_LIMIT = 100;

interface OrderResult {
  transactionId: number;
  status: string;
  product: { productName: string };
  recipientEmail?: string;
  customIdentifier: string;
  cardNumber?: string;
  pinCode?: string;
}

async function getAccessToken(sandbox: boolean): Promise<string> {
  const clientId = process.env.RELOADLY_CLIENT_ID;
  const clientSecret = process.env.RELOADLY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET required');
  }

  const audience = sandbox ? SANDBOX_URL : PROD_URL;
  
  const response = await fetch('https://auth.reloadly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      audience,
    }),
  });

  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getGiftCardCode(transactionId: number, token: string, sandbox: boolean): Promise<{ cardNumber: string; pinCode?: string }> {
  const baseUrl = sandbox ? SANDBOX_URL : PROD_URL;
  
  const response = await fetch(`${baseUrl}/orders/transactions/${transactionId}/cards`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get card code: ${response.status}`);
  }

  const cards = await response.json();
  return cards[0] || {};
}

async function buyGiftCard(options: {
  productId: number;
  amount: number;
  recipient?: string;
  sandbox?: boolean;
}): Promise<OrderResult> {
  const sandbox = options.sandbox ?? process.env.RELOADLY_SANDBOX === 'true';
  const baseUrl = sandbox ? SANDBOX_URL : PROD_URL;
  
  // Safety check
  if (options.amount > DAILY_LIMIT && !sandbox) {
    throw new Error(`Amount exceeds daily limit of $${DAILY_LIMIT}. Use --sandbox for testing.`);
  }
  
  const token = await getAccessToken(sandbox);
  const customIdentifier = `agentpay-${randomUUID().slice(0, 8)}`;
  
  console.log(`\nPlacing order...`);
  console.log(`Product ID: ${options.productId}`);
  console.log(`Amount: $${options.amount}`);
  console.log(`Environment: ${sandbox ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log('');

  const orderPayload: any = {
    productId: options.productId,
    quantity: 1,
    unitPrice: options.amount,
    customIdentifier,
  };

  if (options.recipient) {
    orderPayload.recipientEmail = options.recipient;
  }

  const response = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Order failed: ${response.status} - ${error}`);
  }

  const order = await response.json();
  
  // Get the gift card code
  let cardInfo = { cardNumber: '', pinCode: '' };
  if (order.status === 'SUCCESSFUL') {
    try {
      cardInfo = await getGiftCardCode(order.transactionId, token, sandbox);
    } catch (e) {
      console.warn('Could not retrieve card code immediately. Check order status later.');
    }
  }

  const result: OrderResult = {
    transactionId: order.transactionId,
    status: order.status,
    product: order.product,
    recipientEmail: order.recipientEmail,
    customIdentifier,
    cardNumber: cardInfo.cardNumber,
    pinCode: cardInfo.pinCode,
  };

  // Display result
  console.log('Order placed successfully!');
  console.log(`Transaction ID: ${result.transactionId}`);
  console.log(`Product: ${result.product?.productName}`);
  console.log(`Amount: $${options.amount}`);
  console.log(`Status: ${result.status}`);
  
  if (result.cardNumber) {
    // Mask code in logs for security
    const maskedCode = result.cardNumber.slice(0, 4) + '****' + result.cardNumber.slice(-4);
    console.log(`Gift Card Code: ${maskedCode} (full code sent to recipient)`);
  }
  
  if (result.recipientEmail) {
    console.log(`Sent to: ${result.recipientEmail}`);
  }

  return result;
}

// CLI
const { values } = parseArgs({
  options: {
    'product-id': { type: 'string', short: 'p' },
    amount: { type: 'string', short: 'a' },
    recipient: { type: 'string', short: 'r' },
    sandbox: { type: 'boolean', short: 's', default: false },
  },
});

if (!values['product-id'] || !values.amount) {
  console.error('Usage: npx ts-node buy_giftcard.ts --product-id <id> --amount <usd>');
  console.error('Options:');
  console.error('  --product-id, -p  Product ID from list_products');
  console.error('  --amount, -a      Amount in USD');
  console.error('  --recipient, -r   Email to send gift card (optional)');
  console.error('  --sandbox, -s     Use sandbox environment');
  process.exit(1);
}

buyGiftCard({
  productId: parseInt(values['product-id']!, 10),
  amount: parseFloat(values.amount!),
  recipient: values.recipient,
  sandbox: values.sandbox,
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
