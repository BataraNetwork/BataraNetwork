const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_API_URL = process.env.NODE_API_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());

const nodeApiClient = axios.create({
  baseURL: NODE_API_URL,
});

app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Bataranetwork Explorer API' });
});

// --- SEARCH ---
app.get('/api/search/:query', async (req, res) => {
    const { query } = req.params;
    
    // 1. Is it a number? (Block height)
    if (!isNaN(parseInt(query, 10))) {
        try {
            await nodeApiClient.get(`/block/${query}`);
            return res.json({ type: 'block', value: query });
        } catch (error) {
            // Not a block, continue to next check
        }
    }
    
    // 2. Is it a 64-char hex string? (Transaction ID)
    if (query.length === 64 && /^[0-9a-fA-F]+$/.test(query)) {
        try {
            const { data: pendingTxs } = await nodeApiClient.get('/transactions/pending');
            const transaction = pendingTxs.find((tx) => tx.id === query);
            if (transaction) {
                return res.json({ type: 'transaction', value: query });
            }
            // If not in mempool, it might be in a block, but we can't search that yet.
        } catch (error) {
           // continue
        }
    }

    // 3. Is it a PEM public key? (Address)
    if (query.startsWith('-----BEGIN PUBLIC KEY-----')) {
       try {
           await nodeApiClient.get(`/account/${encodeURIComponent(query)}`);
           return res.json({ type: 'address', value: query });
       } catch (error) {
           // continue
       }
    }

    res.status(404).json({ error: 'Not found. Please search by block height, transaction hash, or full PEM address.' });
});


// --- PROXY ENDPOINTS ---

app.get('/api/status', async (req, res) => {
  try {
    const { data } = await nodeApiClient.get('/status');
    res.json(data);
  } catch (error) {
    console.error(`Error fetching node status: ${error.message}`);
    res.status(500).json({ error: 'Could not connect to the Bataranetwork node.' });
  }
});

app.get('/api/blocks', async (req, res) => {
  try {
    const count = req.query.limit || 10;
    const { data } = await nodeApiClient.get(`/blocks/latest?count=${count}`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching blocks: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch blocks.' });
  }
});

app.get('/api/block/:height', async (req, res) => {
  try {
    const { height } = req.params;
    const { data } = await nodeApiClient.get(`/block/${height}`);
    res.json(data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ error: `Block #${req.params.height} not found.` });
    } else {
      console.error(`Error fetching block #${req.params.height}: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch block.' });
    }
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const { data } = await nodeApiClient.get('/transactions/pending');
    res.json(data);
  } catch (error) {
    console.error(`Error fetching transactions: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch pending transactions.' });
  }
});

app.get('/api/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pendingTxs } = await nodeApiClient.get('/transactions/pending');
    const transaction = pendingTxs.find((tx) => tx.id === id);
    if (transaction) {
      res.json(transaction);
    } else {
      res.status(404).json({ error: `Transaction with ID ${id} not found in the mempool.` });
    }
  } catch (error) {
    console.error(`Error fetching transaction #${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
});

app.get('/api/account/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { data } = await nodeApiClient.get(`/account/${encodeURIComponent(address)}`);
        res.json(data);
    } catch (error) {
        console.error(`Error fetching account: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch account details.' });
    }
});


app.listen(PORT, () => {
  console.log(`Explorer backend is running on http://localhost:${PORT}`);
});
