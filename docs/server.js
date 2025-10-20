
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 4000;
// This URL should point to the Bataranetwork node's HTTP RPC
const NODE_API_URL = process.env.NODE_API_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());

// Create an Axios instance to communicate with the node
const nodeApiClient = axios.create({
  baseURL: NODE_API_URL,
});

// A simple root endpoint for the API to confirm it's running
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the Bataranetwork Explorer API' });
});

// Proxy endpoint for the node's status
app.get('/api/status', async (req, res) => {
  try {
    const { data } = await nodeApiClient.get('/status');
    res.json(data);
  } catch (error) {
    console.error(`Error fetching node status: ${error.message}`);
    res.status(500).json({ error: 'Could not connect to the Bataranetwork node.' });
  }
});

// Proxy and adapt the endpoint to get latest blocks
app.get('/api/blocks', async (req, res) => {
  try {
    // The frontend asks for `limit`, the node provides `count`. We can map this.
    const count = req.query.limit || 10;
    const { data } = await nodeApiClient.get(`/blocks/latest?count=${count}`);
    res.json(data);
  } catch (error) {
    console.error(`Error fetching blocks: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch blocks.' });
  }
});

// Proxy endpoint to get a single block by height
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

// Proxy endpoint for pending transactions from the mempool
app.get('/api/transactions', async (req, res) => {
  try {
    const { data } = await nodeApiClient.get('/transactions/pending');
    res.json(data);
  } catch (error) {
    console.error(`Error fetching transactions: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch pending transactions.' });
  }
});

// Endpoint to find a single transaction by its ID from the mempool
app.get('/api/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: pendingTxs } = await nodeApiClient.get('/transactions/pending');
    const transaction = pendingTxs.find((tx) => tx.id === id);
    if (transaction) {
      res.json(transaction);
    } else {
      // It's possible the tx is already in a block. This endpoint only checks the mempool.
      res.status(404).json({ error: `Transaction with ID ${id} not found in the mempool.` });
    }
  } catch (error) {
    console.error(`Error fetching transaction #${req.params.id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
});

app.listen(PORT, () => {
  console.log(`Explorer backend is running on http://localhost:${PORT}`);
});
