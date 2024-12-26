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
    endpoints: {
      '/buy': 'POST - Buy PumpFun tokens',
      '/sell': 'POST - Sell PumpFun tokens',
      '/coin/:mintAddress': 'GET - Fetch coin data for a specific mint address',
      '/analyze/:mintAddress': 'GET - Analyze coin data for a specific mint address'
    }
  });
});

// Buy tokens
app.post('/buy', async (req, res) => {
  const { privateKey, mintAddress, solIn, priorityFeeInSol, slippageDecimal } = req.body;
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
  const { privateKey, mintAddress, tokenBalance, priorityFeeInSol, slippageDecimal } = req.body;
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
  console.log(`Server is running on port ${port}`);
});

