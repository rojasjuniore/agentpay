/**
 * List available gift card products from Reloadly
 * 
 * Usage:
 *   npx ts-node list_products.ts --country US
 *   npx ts-node list_products.ts --country BR --limit 10
 *   npx ts-node list_products.ts --search amazon
 */

import { parseArgs } from 'util';

const SANDBOX_URL = 'https://giftcards-sandbox.reloadly.com';
const PROD_URL = 'https://giftcards.reloadly.com';

interface Product {
  productId: number;
  productName: string;
  brand: { brandName: string };
  country: { isoName: string; name: string };
  denominationType: 'FIXED' | 'RANGE';
  fixedRecipientDenominations?: number[];
  minRecipientDenomination?: number;
  maxRecipientDenomination?: number;
  senderCurrencyCode: string;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.RELOADLY_CLIENT_ID;
  const clientSecret = process.env.RELOADLY_CLIENT_SECRET;
  const sandbox = process.env.RELOADLY_SANDBOX === 'true';
  
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

async function listProducts(options: {
  country?: string;
  search?: string;
  limit?: number;
}) {
  const sandbox = process.env.RELOADLY_SANDBOX === 'true';
  const baseUrl = sandbox ? SANDBOX_URL : PROD_URL;
  
  const token = await getAccessToken();
  
  // Build query params
  const params = new URLSearchParams();
  if (options.country) params.set('countryCode', options.country);
  if (options.limit) params.set('size', options.limit.toString());
  
  const url = `${baseUrl}/products?${params}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch products: ${response.status} - ${error}`);
  }

  const data = await response.json();
  let products: Product[] = data.content || data;
  
  // Filter by search term if provided
  if (options.search) {
    const searchLower = options.search.toLowerCase();
    products = products.filter(p => 
      p.productName.toLowerCase().includes(searchLower) ||
      p.brand.brandName.toLowerCase().includes(searchLower)
    );
  }

  // Display results
  console.log(`\nAvailable gift cards${options.country ? ` in ${options.country}` : ''}:\n`);
  
  products.forEach((product, index) => {
    const priceRange = product.denominationType === 'FIXED'
      ? product.fixedRecipientDenominations?.join(', ')
      : `$${product.minRecipientDenomination} - $${product.maxRecipientDenomination}`;
    
    console.log(`${index + 1}. ${product.productName}`);
    console.log(`   ID: ${product.productId}`);
    console.log(`   Price: ${priceRange} ${product.senderCurrencyCode}`);
    console.log('');
  });

  console.log(`Total: ${products.length} products`);
  
  return products;
}

// CLI
const { values } = parseArgs({
  options: {
    country: { type: 'string', short: 'c' },
    search: { type: 'string', short: 's' },
    limit: { type: 'string', short: 'l', default: '20' },
  },
});

listProducts({
  country: values.country,
  search: values.search,
  limit: parseInt(values.limit!, 10),
}).catch(console.error);
