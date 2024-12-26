import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { pumpFunBuy, pumpFunSell } from './swap';
import { getCoinData, analyzeCoinData } from './api';
import { TransactionMode } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = 'https://solana-pump-fun-api-0e1d8b5ba4e9.herokuapp.com';

app.use(express.json());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Solana PumpFun API',
    baseUrl,
    endpoints: {
      '/buy': 'POST - Buy PumpFun tokens',
      '/sell': 'POST - Sell PumpFun tokens',
      '/coin/:mintAddress': 'GET - Fetch coin data for a specific mint address',
      '/analyze/:mintAddress': 'GET - Analyze coin data for a specific mint address',
      '/ping': 'GET - Health check endpoint'
    }
  });
});

// Health check endpoint
app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is up and running' });
});

// Buy tokens
app.post('/buy', async (req, res) => {
  console.log('Received buy request:');
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  let { privateKey, mintAddress, solIn, priorityFeeInSol, slippageDecimal } = req.body;

  // If the data is in query parameters, use those instead
  if (Object.keys(req.query).length > 0) {
    privateKey = req.query.privateKey as string;
    mintAddress = req.query.mintAddress as string;
    solIn = parseFloat(req.query.solIn as string);
    priorityFeeInSol = parseFloat(req.query.priorityFeeInSol as string) || 0;
    slippageDecimal = parseFloat(req.query.slippageDecimal as string) || 0.25;
  }
  
  // Input validation
  if (!privateKey || !mintAddress || typeof solIn !== 'number' || solIn <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid input parameters' });
  }

  try {
    const result = await pumpFunBuy(TransactionMode.Execution, privateKey, mintAddress, solIn, priorityFeeInSol, slippageDecimal);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error in buy operation:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        success: false, 
        error: 'Buy operation failed', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'An unexpected error occurred during the buy operation' 
      });
    }
  }
});

// Sell tokens
app.post('/sell', async (req, res) => {
  let { privateKey, mintAddress, tokenBalance, priorityFeeInSol, slippageDecimal } = req.body;

  // If the data is in query parameters, use those instead
  if (Object.keys(req.query).length > 0) {
    privateKey = req.query.privateKey as string;
    mintAddress = req.query.mintAddress as string;
    tokenBalance = parseFloat(req.query.tokenBalance as string);
    priorityFeeInSol = parseFloat(req.query.priorityFeeInSol as string) || 0;
    slippageDecimal = parseFloat(req.query.slippageDecimal as string) || 0.25;
  }

  // Input validation
  if (!privateKey || !mintAddress || typeof tokenBalance !== 'number' || tokenBalance <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid input parameters' });
  }
  try {
    const result = await pumpFunSell(TransactionMode.Execution, privateKey, mintAddress, tokenBalance, priorityFeeInSol, slippageDecimal);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error in sell operation:', error);
    if (error instanceof Error) {
      res.status(400).json({ 
        success: false, 
        error: 'Sell operation failed', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'An unexpected error occurred during the sell operation' 
      });
    }
  }
});

// Fetch coin data
app.get('/coin/:mintAddress', async (req, res) => {
  const { mintAddress } = req.params;
  try {
    const coinData = await getCoinData(mintAddress);
    if (coinData) {
      res.json(coinData);
    } else {
      res.status(404).json({ error: 'Coin data not found for the given mint address' });
    }
  } catch (error) {
    console.error('Error fetching coin data:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to fetch coin data', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'An unexpected error occurred while fetching coin data' 
      });
    }
  }
});

// Analyze coin data
app.get('/analyze/:mintAddress', async (req, res) => {
  const { mintAddress } = req.params;
  try {
    const analysis = await analyzeCoinData(mintAddress);
    if (analysis) {
      res.json(analysis);
    } else {
      res.status(404).json({ error: 'Unable to analyze coin data for the given mint address' });
    }
  } catch (error) {
    console.error('Error analyzing coin data:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to analyze coin data', 
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'An unexpected error occurred while analyzing coin data' 
      });
    }
  }
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'An unexpected error occurred', 
    details: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

app.listen(port, () => {
  console.log(`Server is running on ${baseUrl}`);
});

