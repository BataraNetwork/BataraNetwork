import { Level } from 'level';
import { Block, Account } from '../types';

const LATEST_BLOCK_KEY = 'latest_block';

export class LevelStorage {
  private db: Level<string, any>;

  constructor(path: string) {
    this.db = new Level(path, { valueEncoding: 'json' });
  }

  async open(): Promise<void> {
    await this.db.open();
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  // --- Block Methods ---

  async getBlock(height: number): Promise<Block | null> {
    try {
      const block = await this.db.get(`block:${height}`);
      return block;
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  async saveBlock(block: Block): Promise<void> {
    const batch = this.db.batch();
    batch.put(`block:${block.height}`, block);
    batch.put(LATEST_BLOCK_KEY, block);
    await batch.write();
  }

  async getLatestBlock(): Promise<Block | null> {
    try {
      const block = await this.db.get(LATEST_BLOCK_KEY);
      return block;
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  // --- Account State Methods ---
  
  async getAccount(address: string): Promise<Account | null> {
    try {
      const account = await this.db.get(`account:${address}`);
      return account;
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }
  
  async saveAccount(account: Account): Promise<void> {
    await this.db.put(`account:${account.address}`, account);
  }
  
  async batchUpdateAccounts(accounts: Account[]): Promise<void> {
    const batch = this.db.batch();
    for (const account of accounts) {
      batch.put(`account:${account.address}`, account);
    }
    await batch.write();
  }
}