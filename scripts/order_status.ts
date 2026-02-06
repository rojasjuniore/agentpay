/**
 * Check order status and retrieve gift card codes
 * 
 * Usage:
 *   npx ts-node order_status.ts --transaction-id 12345
 *   npx ts-node order_status.ts --transaction-id 12345 --sandbox
 */

import { parseArgs } from 'util';

const SANDBOX_URL = 'https://giftcards-sandbox.reloadly.com';
const PROD_URL = 'https://giftcards.reloadly.com';

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

async function getOrderStatus(transactionId: number, sandbox: boolean) {
  const baseUrl = sandbox ? SANDBOX_URL : PROD_URL;
  const token = await getAccessToken(sandbox);

  // Get order details
  const orderResponse = await fetch(`${baseUrl}/orders/transactions/${transactionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!orderResponse.ok) {
    throw new Error(`Failed to get order: ${orderResponse.status}`);
  }

  const order = await orderResponse.json();

  // Get card codes
  let cards: any[] = [];
  try {
    const cardsResponse = await fetch(`${baseUrl}/orders/transactions/${transactionId}/cards`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (cardsResponse.ok) {
      cards = await cardsResponse.json();
    }
  } catch (e) {
    // Cards might not be available yet
  }

  // Display order info
  console.log('\nOrder Details:');
  console.log('─'.repeat(40));
  console.log(`Transaction ID: ${order.transactionId}`);
  console.log(`Status: ${order.status}`);
  console.log(`Product: ${order.product?.productName}`);
  console.log(`Amount: $${order.amount?.recipientCurrencyCode || 'N/A'} ${order.amount?.recipientAmount || 'N/A'}`);
  console.log(`Created: ${order.transactionCreatedTime}`);
  
  if (order.recipientEmail) {
    console.log(`Recipient Email: ${order.recipientEmail}`);
  }

  if (cards.length > 0) {
    console.log('\nGift Card(s):');
    console.log('─'.repeat(40));
    cards.forEach((card, i) => {
      console.log(`Card ${i + 1}:`);
      console.log(`  Code: ${card.cardNumber}`);
      if (card.pinCode) {
        console.log(`  PIN: ${card.pinCode}`);
      }
    });
  } else {
    console.log('\nNote: Gift card codes not yet available or already redeemed.');
  }

  return { order, cards };
}

// CLI
const { values } = parseArgs({
  options: {
    'transaction-id': { type: 'string', short: 't' },
    sandbox: { type: 'boolean', short: 's', default: false },
  },
});

if (!values['transaction-id']) {
  console.error('Usage: npx ts-node order_status.ts --transaction-id <id>');
  console.error('Options:');
  console.error('  --transaction-id, -t  Transaction ID from order');
  console.error('  --sandbox, -s         Use sandbox environment');
  process.exit(1);
}

getOrderStatus(parseInt(values['transaction-id']!, 10), values.sandbox!).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
