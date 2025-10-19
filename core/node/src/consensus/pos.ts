// core/node/src/consensus/pos.ts

import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';
import { Validator } from '../validator/validator';
import { Block, Transaction } from '../types';
import { hash } from '../utils/crypto';
import { StakingManager } from '../staking/stakingManager';

/**
 * Implements a simulated Proof-of-Stake consensus mechanism.
 * In this simulation, validators are chosen in a round-robin fashion from the active stakers.
 */
export class PoSConsensus {
  private blockchain: Blockchain;
  private mempool: Mempool;
  private validator: Validator;
  private stakingManager: StakingManager;

  constructor(
    blockchain: Blockchain, 
    mempool: Mempool, 
    validator: Validator,
    stakingManager: StakingManager
  ) {
    this.blockchain = blockchain;
    this.mempool = mempool;
    this.validator = validator;
    this.stakingManager = stakingManager;
  }

  async createBlock(): Promise<Block> {
    const latestBlock = this.blockchain.getLatestBlock();
    
    // In a real PoS system, the logic to determine if this node is the next validator would be complex.
    // Here, we'll simulate it by checking if our validator is the one chosen by the staking manager.
    const nextValidator = this.stakingManager.selectNextValidator(latestBlock.height);
    
    if (this.validator.publicKey !== nextValidator) {
      throw new Error(`Not our turn to produce a block. Next validator is ${nextValidator ? nextValidator.substring(0, 15) : 'N/A'}...`);
    }

    const transactions = this.mempool.getPendingTransactions();
    const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
    
    const newBlockData = {
      height: latestBlock.height + 1,
      timestamp: Date.now(),
      transactions,
      previousHash: latestBlock.hash,
      validator: this.validator.publicKey,
      totalFees,
    };

    const blockHash = hash(JSON.stringify({
      height: newBlockData.height,
      timestamp: newBlockData.timestamp,
      transactions: newBlockData.transactions,
      previousHash: newBlockData.previousHash,
      totalFees: newBlockData.totalFees,
    }));

    const signature = this.validator.sign(blockHash);

    const newBlock: Block = {
      ...newBlockData,
      hash: blockHash,
      signature: signature,
    };
    
    return newBlock;
  }
}