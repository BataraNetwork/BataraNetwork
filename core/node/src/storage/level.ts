import { Level } from 'level';
import { Block } from '../types';

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
}
