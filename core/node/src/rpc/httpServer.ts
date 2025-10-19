
import express from 'express';
import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';
import { P2pService } from '../p2p/p2pService';
import { Transaction } from '../types';

export class HttpServer {
  private app: express.Application;

  constructor(
    private blockchain: Blockchain,
    private mempool: Mempool,
    private p2p: P2pService,
    port: number
  ) {
    this.app = express();
    this.app.use(express.json());
    this.initializeRoutes();
    this.app.listen(port, () => {
      console.log(`HTTP server listening on port ${port}`);
    });
  }

  private initializeRoutes(): void {
    // Get node status
    this.app.get('/status', (req, res) => {
      res.json({
        latestBlockHeight: this.blockchain.getLatestBlock().height,
        pendingTransactions: this.mempool.getPendingTransactions().length,
      });
    });

    // Get a block by height
    this.app.get('/block/:height', async (req, res) => {
      const height = parseInt(req.params.height, 10);
      if (isNaN(height)) {
        return res.status(400).json({ error: 'Invalid block height' });
      }
      const block = await this.blockchain.getBlock(height);
      if (block) {
        res.json(block);
      } else {
        res.status(404).json({ error: `Block #${height} not found` });
      }
    });
    
    // Get latest blocks
    this.app.get('/blocks/latest', async (req, res) => {
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 10;
      const blocks = await this.blockchain.getLatestBlocks(count);
      res.json(blocks);
    });

    // Get all pending transactions
    this.app.get('/transactions/pending', (req, res) => {
        res.json(this.mempool.getAll());
    });

    // Broadcast a new transaction
    this.app.post('/transaction', (req, res) => {
      const transaction: Transaction = req.body;
      // Basic validation
      if (!transaction || !transaction.id || !transaction.from || !transaction.to || transaction.amount === undefined || transaction.fee === undefined) {
          return res.status(400).json({ error: 'Invalid transaction format' });
      }

      const success = this.mempool.addTransaction(transaction);
      if (success) {
        this.p2p.broadcastTransaction(transaction);
        res.status(201).json({ message: 'Transaction added to mempool', transactionId: transaction.id });
      } else {
        res.status(409).json({ message: 'Transaction already in mempool' });
      }
    });

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        // Perform a quick check to see if we can access the latest block from storage.
        // This validates that the database connection is active.
        const latestBlock = this.blockchain.getLatestBlock();
        const blockFromDb = await this.blockchain.getBlock(latestBlock.height);

        if (blockFromDb && blockFromDb.hash === latestBlock.hash) {
          res.status(200).send('OK');
        } else {
          // This state would indicate a serious problem, like data corruption or DB failure.
          res.status(500).send('Internal Server Error: Blockchain integrity check failed.');
        }
      } catch (error) {
        console.error('Health check failed with an exception:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }
}