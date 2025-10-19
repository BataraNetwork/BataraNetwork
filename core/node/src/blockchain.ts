import { LevelStorage } from './storage/level';
import { Block } from './types';
import { hash, verify } from './utils/crypto';
import { Mempool } from './mempool';

export class Blockchain {
  private storage: LevelStorage;
  private mempool: Mempool;
  private latestBlock!: Block; // Initialized in initialize()

  constructor(storage: LevelStorage, mempool: Mempool) {
    this.storage = storage;
    this.mempool = mempool;
  }

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
      validator: 'genesis-validator',
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
      signature: 'genesis-signature',
    };
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

    // If all checks pass, add the block
    await this.storage.saveBlock(block);
    this.latestBlock = block;
    this.mempool.removeTransactions(block.transactions);
    
    // Log the fee reward for the validator
    if (block.totalFees > 0) {
      console.log(`Validator for block #${block.height} earned ${block.totalFees} in transaction fees.`);
    }

    return true;
  }
}