
import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';
import { Validator } from '../validator/validator';
import { Block } from '../types';
import { hash } from '../utils/crypto';

export class PoAConsensus {
  private blockchain: Blockchain;
  private mempool: Mempool;
  private validator: Validator;

  constructor(blockchain: Blockchain, mempool: Mempool, validator: Validator) {
    this.blockchain = blockchain;
    this.mempool = mempool;
    this.validator = validator;
  }

  async createBlock(): Promise<Block> {
    const latestBlock = this.blockchain.getLatestBlock();
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