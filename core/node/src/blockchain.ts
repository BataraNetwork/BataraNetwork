// core/node/src/blockchain.ts

import { LevelStorage } from './storage/level';
import { Block, Transaction, TransactionType } from './types';
import { hash, verify } from './utils/crypto';
import { Mempool } from './mempool';
import { StakingManager } from './staking/stakingManager';
import { WasmEngine } from './vm/wasmEngine';
import { GovernanceModule } from './governance/governanceModule';
import { StateManager } from './state/stateManager';

/**
 * The Blockchain class orchestrates the core logic of the chain itself.
 * It is responsible for managing the sequence of blocks, processing transactions within those blocks,
 * and ensuring the integrity of the chain through validation.
 */
export class Blockchain {
  private latestBlock!: Block; // Initialized in initialize()

  constructor(
    private storage: LevelStorage, 
    private mempool: Mempool,
    private stakingManager: StakingManager,
    private wasmEngine: WasmEngine,
    private governanceModule: GovernanceModule,
    private stateManager: StateManager,
  ) {}

  /**
   * Initializes the blockchain by loading the latest block from storage or creating a genesis block if none exists.
   * This method must be called before any other blockchain operations are performed.
   */
  public async initialize(): Promise<void> {
    const latest = await this.storage.getLatestBlock();
    if (latest) {
      this.latestBlock = latest;
    } else {
      const genesisBlock = this.createGenesisBlock();
      await this.storage.saveBlock(genesisBlock);
      this.latestBlock = genesisBlock;
    }
    console.log(`Blockchain initialized. Latest block is #${this.latestBlock.height}`);
  }

  private createGenesisBlock(): Block {
    const genesisData = {
      height: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0'.repeat(64),
      validator: 'genesis-validator-PoS', // Updated for PoS
      totalFees: 0,
    };

    const blockHash = hash(JSON.stringify({
        height: genesisData.height,
        timestamp: genesisData.timestamp,
        transactions: genesisData.transactions,
        previousHash: genesisData.previousHash,
        totalFees: genesisData.totalFees,
    }));

    return {
      ...genesisData,
      hash: blockHash,
      signature: 'genesis-signature-PoS',
    };
  }
  
  /**
   * Processes a single transaction, delegating state changes to the appropriate module (StateManager, WasmEngine, etc.).
   * This is the central point for applying transaction logic to the world state.
   * @param transaction The transaction to process.
   * @returns A boolean indicating if the transaction was processed successfully.
   */
  private async processTransaction(transaction: Transaction): Promise<boolean> {
    // Basic signature verification can be done here, but StateManager handles core state logic.
    // const isValidSignature = verify(transaction.id, transaction.from, transaction.signature);
    // if (!isValidSignature) return false;

    // Apply core state changes (balance, nonce)
    const stateApplied = await this.stateManager.applyTransaction(transaction);
    if (!stateApplied) {
      return false; // Stop if nonce or balance check fails
    }

    // Apply logic specific to other modules
    switch (transaction.type) {
      case TransactionType.TRANSFER:
        // StateManager already handled the balance transfer.
        return true;

      case TransactionType.CONTRACT_CREATION:
        await this.wasmEngine.deployContract(transaction);
        return true;
        
      case TransactionType.CONTRACT_CALL:
        await this.wasmEngine.executeContract(transaction);
        return true;
        
      case TransactionType.STAKE:
        this.stakingManager.processStake(transaction);
        return true;

      case TransactionType.GOVERNANCE_PROPOSAL:
        this.governanceModule.submitProposal(transaction, this.latestBlock.height);
        return true;

      case TransactionType.GOVERNANCE_VOTE:
        this.governanceModule.castVote(transaction);
        return true;

      default:
        console.warn(`Unknown transaction type: ${(transaction as any).type}`);
        return false;
    }
  }

  public getLatestBlock(): Block {
    return this.latestBlock;
  }

  public async getBlock(height: number): Promise<Block | null> {
    return this.storage.getBlock(height);
  }

  public async getLatestBlocks(count: number): Promise<Block[]> {
    const latestHeight = this.latestBlock.height;
    const blocks: Block[] = [];
    const startHeight = Math.max(0, latestHeight - count + 1);

    for (let i = latestHeight; i >= startHeight; i--) {
        const block = await this.getBlock(i);
        if (block) {
            blocks.push(block);
        }
    }
    return blocks;
  }
  
  /**
   * Returns the public key of the validator expected to produce the next block.
   */
  public getCurrentValidator(): string | null {
    return this.stakingManager.selectNextValidator(this.latestBlock.height);
  }

  /**
   * Validates and adds a new block to the blockchain.
   * This involves checking the block's height, hash, signature, validator, and processing all its transactions.
   * @param block The block to add.
   * @returns A boolean indicating if the block was successfully added.
   */
  public async addBlock(block: Block): Promise<boolean> {
    // 1. Basic validation (height and previous hash)
    if (block.height !== this.latestBlock.height + 1) {
        console.error(`[Validation Failed] Invalid block height for block #${block.height}. Expected ${this.latestBlock.height + 1}, got ${block.height}`);
        return false;
    }
    if (block.previousHash !== this.latestBlock.hash) {
        console.error(`[Validation Failed] Invalid previous hash for block #${block.height}. Expected ${this.latestBlock.hash}, got ${block.previousHash}`);
        return false;
    }

    // 2. Hash verification (data integrity)
    const expectedHash = hash(JSON.stringify({
        height: block.height,
        timestamp: block.timestamp,
        transactions: block.transactions,
        previousHash: block.previousHash,
        totalFees: block.totalFees,
    }));
    if (block.hash !== expectedHash) {
        console.error(`[Validation Failed] Invalid hash for block #${block.height}. Expected ${expectedHash}, got ${block.hash}`);
        return false;
    }

    // 3. Signature verification (authenticity)
    if (!verify(block.hash, block.validator, block.signature)) {
        console.error(`[Validation Failed] Invalid signature for block #${block.height}. The validator's signature is not correct.`);
        return false;
    }
    
    // 4. PoS Validator verification (consensus)
    const expectedValidator = this.stakingManager.selectNextValidator(this.latestBlock.height);
    if (block.validator !== expectedValidator) {
        console.error(`[Validation Failed] Invalid validator for block #${block.height}. Expected ${expectedValidator ? expectedValidator.substring(0,15) : 'N/A'}..., got ${block.validator.substring(0,15)}...`);
        return false;
    }
    
    // 5. Process all transactions in the block
    // TODO: In a real implementation, we would create a temporary state snapshot here,
    // apply transactions to it, and only commit to the main state if all succeed.
    for (const tx of block.transactions) {
        const success = await this.processTransaction(tx);
        if (!success) {
            console.error(`[Validation Failed] Block #${block.height} contains an invalid transaction: ${tx.id}`);
            // In a real system, we might have more complex rollback logic here.
            return false;
        }
    }
    
    // 6. Tally votes for any ended governance proposals
    this.governanceModule.tallyVotes(block.height);

    // If all checks pass, commit the block
    await this.storage.saveBlock(block);
    this.latestBlock = block;
    this.mempool.removeTransactions(block.transactions);
    
    if (block.totalFees > 0) {
      console.log(`Validator for block #${block.height} earned ${block.totalFees} in transaction fees.`);
    }

    return true;
  }
}
