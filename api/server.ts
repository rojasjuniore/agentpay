/**
 * AgentPay API Server
 * La cuenta bancaria para agentes AI
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { base, baseSepolia } from 'viem/chains';

const app = express();
app.use(cors());
app.use(express.json());

// Config
const CHAIN = baseSepolia; // Use testnet for hackathon
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC

// In-memory storage (use DB in production)
const agents: Map<string, AgentAccount> = new Map();
const cards: Map<string, VirtualCard> = new Map();
const transactions: Map<string, Transaction> = new Map();

// Types
interface AgentAccount {
  id: string;
  name: string;
  walletAddress: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

interface VirtualCard {
  id: string;
  agentId: string;
  last4: string;
  expiry: string;
  status: 'active' | 'frozen' | 'cancelled';
  spendLimit: number;
  spent: number;
  createdAt: Date;
}

interface Transaction {
  id: string;
  agentId: string;
  type: 'deposit' | 'spend' | 'transfer';
  amount: number;
  rail: string;
  status: 'pending' | 'completed' | 'failed';
  merchant?: string;
  description?: string;
  createdAt: Date;
}

// Viem client
const client = createPublicClient({
  chain: CHAIN,
  transport: http(),
});

// ERC20 ABI for balance
const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ============ ENDPOINTS ============

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'AgentPay',
    version: '1.0.0',
    tagline: 'La cuenta bancaria para agentes AI. USDC in, mundo real out.',
    endpoints: [
      'POST /register - Register new agent',
      'GET /balance/:agentId - Check USDC balance',
      'GET /deposit/:agentId - Get deposit address',
      'POST /spend - Spend USDC',
      'POST /card/create - Create virtual card',
      'GET /card/:agentId - Get card details',
      'GET /history/:agentId - Transaction history',
    ],
  });
});

// Register new agent
app.post('/register', async (req, res) => {
  try {
    const { name, walletAddress, metadata = {} } = req.body;

    if (!name || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, walletAddress',
      });
    }

    const agent: AgentAccount = {
      id: uuidv4(),
      name,
      walletAddress,
      createdAt: new Date(),
      metadata,
    };

    agents.set(agent.id, agent);

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        walletAddress: agent.walletAddress,
        depositAddress: agent.walletAddress, // Same for now
      },
      message: 'Agent registered. Deposit USDC to your wallet to start spending.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get balance
app.get('/balance/:agentId', async (req, res) => {
  try {
    const agent = agents.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const balance = await client.readContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [agent.walletAddress as `0x${string}`],
    });

    const formatted = formatUnits(balance, 6);

    res.json({
      success: true,
      agentId: agent.id,
      balance: {
        usdc: formatted,
        raw: balance.toString(),
      },
      chain: CHAIN.name,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get deposit address
app.get('/deposit/:agentId', async (req, res) => {
  try {
    const agent = agents.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    res.json({
      success: true,
      agentId: agent.id,
      depositAddress: agent.walletAddress,
      chain: CHAIN.name,
      chainId: CHAIN.id,
      acceptedTokens: ['USDC'],
      usdcContract: USDC_ADDRESS,
      faucet: 'https://faucet.circle.com', // Testnet faucet
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Spend USDC
app.post('/spend', async (req, res) => {
  try {
    const { agentId, amount, rail, merchant, description } = req.body;

    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    // Validate rail
    const validRails = ['visa', 'sepa', 'pix', 'giftcard', 'api', 'crypto'];
    const selectedRail = rail || 'visa';
    if (!validRails.includes(selectedRail)) {
      return res.status(400).json({ success: false, error: `Invalid rail. Use: ${validRails.join(', ')}` });
    }

    // Create transaction
    const tx: Transaction = {
      id: uuidv4(),
      agentId,
      type: 'spend',
      amount,
      rail: selectedRail,
      status: 'pending',
      merchant,
      description,
      createdAt: new Date(),
    };

    transactions.set(tx.id, tx);

    // In production, this would:
    // 1. Check balance
    // 2. Route to appropriate provider (GnosisPay, Bitrefill, etc.)
    // 3. Execute payment
    // 4. Update status

    // For hackathon demo, simulate success
    setTimeout(() => {
      tx.status = 'completed';
    }, 2000);

    res.json({
      success: true,
      transaction: {
        id: tx.id,
        amount: `${amount} USDC`,
        rail: selectedRail,
        status: tx.status,
        merchant: merchant || 'N/A',
      },
      message: `Spending ${amount} USDC via ${selectedRail}...`,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Create virtual card
app.post('/card/create', async (req, res) => {
  try {
    const { agentId, spendLimit = 100 } = req.body;

    const agent = agents.get(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    // Check if agent already has a card
    const existingCard = Array.from(cards.values()).find(c => c.agentId === agentId && c.status === 'active');
    if (existingCard) {
      return res.json({
        success: true,
        card: {
          id: existingCard.id,
          last4: existingCard.last4,
          expiry: existingCard.expiry,
          status: existingCard.status,
          spendLimit: existingCard.spendLimit,
        },
        message: 'Agent already has an active card',
      });
    }

    // Create new virtual card
    // In production, this calls GnosisPay API
    const card: VirtualCard = {
      id: uuidv4(),
      agentId,
      last4: Math.random().toString().slice(2, 6),
      expiry: '12/28',
      status: 'active',
      spendLimit,
      spent: 0,
      createdAt: new Date(),
    };

    cards.set(card.id, card);

    res.json({
      success: true,
      card: {
        id: card.id,
        last4: card.last4,
        expiry: card.expiry,
        status: card.status,
        spendLimit: card.spendLimit,
        network: 'Visa',
        provider: 'GnosisPay',
      },
      message: 'Virtual card created! Use /card/:agentId to get full details.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Get card details
app.get('/card/:agentId', async (req, res) => {
  try {
    const agent = agents.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const card = Array.from(cards.values()).find(c => c.agentId === req.params.agentId && c.status === 'active');
    if (!card) {
      return res.status(404).json({ success: false, error: 'No active card found. Create one with POST /card/create' });
    }

    // In production, fetch real card details from GnosisPay
    res.json({
      success: true,
      card: {
        id: card.id,
        // Mock card number for demo (real integration would return actual number)
        number: `4242 4242 4242 ${card.last4}`,
        expiry: card.expiry,
        cvv: '***', // Only show on first request in production
        status: card.status,
        spendLimit: card.spendLimit,
        spent: card.spent,
        available: card.spendLimit - card.spent,
        network: 'Visa',
        provider: 'GnosisPay',
      },
      usage: {
        online: 'Use card number, expiry, CVV for online purchases',
        applepay: 'Add to Apple Pay wallet',
        googlepay: 'Add to Google Pay wallet',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Transaction history
app.get('/history/:agentId', async (req, res) => {
  try {
    const agent = agents.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const agentTxs = Array.from(transactions.values())
      .filter(tx => tx.agentId === req.params.agentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    res.json({
      success: true,
      agentId: agent.id,
      transactions: agentTxs,
      count: agentTxs.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ============ START SERVER ============

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🦞 AgentPay - La cuenta bancaria para agentes AI       ║
  ║                                                           ║
  ║   USDC in, mundo real out.                               ║
  ║                                                           ║
  ║   Server running on http://localhost:${PORT}               ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
