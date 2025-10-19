// core/node/src/rpc/httpServer.ts

import express from 'express';
import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';
import { P2pService } from '../p2p/p2pService';
import { StakingManager } from '../staking/stakingManager';
import { GovernanceModule } from '../governance/governanceModule';
import { StateManager } from '../state/stateManager';
import { Transaction } from '../types';

export class HttpServer {
  private app: express.Application;

  constructor(
    private blockchain: Blockchain,
    private mempool: Mempool,
    private p2p: P2pService,
    private stakingManager: StakingManager,
    private governanceModule: GovernanceModule,
    private stateManager: StateManager,
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
    // --- Blockchain Routes ---
    this.app.get('/status', (req, res) => {
      res.json({
        latestBlockHeight: this.blockchain.getLatestBlock().height,
        pendingTransactions: this.mempool.getPendingTransactions().length,
      });
    });
    this.app.get('/block/:height', async (req, res) => {
      const height = parseInt(req.params.height, 10);
      if (isNaN(height)) return res.status(400).json({ error: 'Invalid block height' });
      const block = await this.blockchain.getBlock(height);
      if (block) res.json(block);
      else res.status(404).json({ error: `Block #${height} not found` });
    });
    this.app.get('/blocks/latest', async (req, res) => {
      const count = req.query.count ? parseInt(req.query.count as string, 10) : 10;
      const blocks = await this.blockchain.getLatestBlocks(count);
      res.json(blocks);
    });
    this.app.get('/transactions/pending', (req, res) => {
        res.json(this.mempool.getAll());
    });
    this.app.post('/transaction', (req, res) => {
      const transaction: Transaction = req.body;
      const success = this.mempool.addTransaction(transaction);
      if (success) {
        this.p2p.broadcastTransaction(transaction);
        res.status(201).json({ message: 'Transaction added to mempool', transactionId: transaction.id });
      } else {
        res.status(400).json({ message: 'Transaction failed validation or already in mempool' });
      }
    });
    
    // --- State Routes ---
    this.app.get('/account/:address', async (req, res) => {
        const { address } = req.params;
        if (!address) return res.status(400).json({ error: 'Address parameter is required' });
        try {
            const account = await this.stateManager.getAccount(address);
            res.json(account);
        } catch (error) {
            console.error(`Error fetching account ${address}:`, error);
            res.status(500).json({ error: 'Failed to retrieve account data' });
        }
    });

    // --- Staking & Consensus Routes ---
    this.app.get('/staking/validators', (req, res) => {
        res.json(this.stakingManager.getActiveValidators());
    });
    this.app.get('/consensus/validator', (req, res) => {
      const nextValidator = this.blockchain.getCurrentValidator();
      if (nextValidator) {
          res.json({ nextValidator });
      } else {
          res.status(404).json({ error: 'No active validators to select from.' });
      }
    });
    this.app.post('/staking/stake', (req, res) => {
        // In a real app, this would be a signed transaction. Here we simulate it.
        const stakeTx: Transaction = req.body;
        const success = this.mempool.addTransaction(stakeTx);
        if (success) {
            this.p2p.broadcastTransaction(stakeTx);
            res.status(201).json({ message: 'Stake transaction added to mempool', transactionId: stakeTx.id });
        } else {
            res.status(400).json({ error: 'Invalid stake transaction' });
        }
    });

    // --- Governance Routes ---
    this.app.get('/governance/proposals', (req, res) => {
        res.json(this.governanceModule.getProposals());
    });
    this.app.post('/governance/propose', (req, res) => {
        const proposalTx: Transaction = req.body;
        const success = this.mempool.addTransaction(proposalTx);
        if (success) {
            this.p2p.broadcastTransaction(proposalTx);
            res.status(201).json({ message: 'Proposal transaction added to mempool', transactionId: proposalTx.id });
        } else {
            res.status(400).json({ error: 'Invalid proposal transaction' });
        }
    });
    this.app.post('/governance/vote', (req, res) => {
        const voteTx: Transaction = req.body;
        const success = this.mempool.addTransaction(voteTx);
        if (success) {
            this.p2p.broadcastTransaction(voteTx);
            res.status(201).json({ message: 'Vote transaction added to mempool', transactionId: voteTx.id });
        } else {
            res.status(400).json({ error: 'Invalid vote transaction' });
        }
    });

    // --- Health Check ---
    this.app.get('/health', async (req, res) => {
      try {
        const latestBlock = this.blockchain.getLatestBlock();
        const blockFromDb = await this.blockchain.getBlock(latestBlock.height);
        if (blockFromDb && blockFromDb.hash === latestBlock.hash) {
          res.status(200).send('OK');
        } else {
          res.status(500).send('Internal Server Error: Blockchain integrity check failed.');
        }
      } catch (error) {
        console.error('Health check failed with an exception:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }
}