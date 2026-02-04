/**
 * Check USDC balance on supported chains
 * 
 * Usage:
 *   npx ts-node check_balance.ts --chain base-sepolia
 *   npx ts-node check_balance.ts --chain sepolia --address 0x...
 */

import { createPublicClient, http, formatUnits } from 'viem';
import { baseSepolia, sepolia, arbitrumSepolia, avalancheFuji, polygonAmoy } from 'viem/chains';
import { parseArgs } from 'util';

// USDC contract addresses (testnet)
const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  'sepolia': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  'arbitrum-sepolia': '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  'avalanche-fuji': '0x5425890298aed601595a70AB815c96711a31Bc65',
  'polygon-amoy': '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
};

const CHAINS: Record<string, any> = {
  'sepolia': sepolia,
  'base-sepolia': baseSepolia,
  'arbitrum-sepolia': arbitrumSepolia,
  'avalanche-fuji': avalancheFuji,
  'polygon-amoy': polygonAmoy,
};

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

async function checkBalance(chainName: string, address?: string) {
  const chain = CHAINS[chainName];
  const usdcAddress = USDC_ADDRESSES[chainName];
  
  if (!chain || !usdcAddress) {
    console.error(`Unsupported chain: ${chainName}`);
    console.error(`Supported chains: ${Object.keys(CHAINS).join(', ')}`);
    process.exit(1);
  }

  // If no address provided, derive from private key
  let walletAddress = address;
  if (!walletAddress) {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      console.error('Either --address or PRIVATE_KEY env var required');
      process.exit(1);
    }
    // Import account to get address
    const { privateKeyToAccount } = await import('viem/accounts');
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    walletAddress = account.address;
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const balance = await client.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletAddress as `0x${string}`],
    });

    const decimals = await client.readContract({
      address: usdcAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });

    const formatted = formatUnits(balance, decimals);
    
    console.log(`Wallet: ${walletAddress}`);
    console.log(`Chain: ${chain.name}`);
    console.log(`USDC Balance: ${formatted}`);
    
    return { address: walletAddress, chain: chainName, balance: formatted };
  } catch (error) {
    console.error('Error checking balance:', error);
    process.exit(1);
  }
}

// CLI
const { values } = parseArgs({
  options: {
    chain: { type: 'string', short: 'c', default: 'base-sepolia' },
    address: { type: 'string', short: 'a' },
  },
});

checkBalance(values.chain!, values.address);
