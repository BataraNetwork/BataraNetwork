// FIX: Import `jest` from `@jest/globals` to resolve type errors.
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { Blockchain } from '../src/blockchain';
import { LevelStorage } from '../src/storage/level';
import { Block } from '../src/types';
import * as crypto from '../src/utils/crypto';
import * as fs from 'fs';
import { Mempool } from '../src/mempool';

const TEST_DB_PATH = './test-db';

describe('Blockchain', () => {
    let storage: LevelStorage;
    let mempool: Mempool;
    let blockchain: Blockchain;

    beforeEach(async () => {
        // Clean up database before each test
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
        storage = new LevelStorage(TEST_DB_PATH);
        await storage.open();
        mempool = new Mempool();
        blockchain = new Blockchain(storage, mempool);
        await blockchain.initialize();
    });

    afterEach(async () => {
        await storage.close();
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
    });

    it('should initialize with a genesis block', () => {
        const latestBlock = blockchain.getLatestBlock();
        expect(latestBlock).toBeDefined();
        expect(latestBlock.height).toBe(0);
        expect(latestBlock.previousHash).toBe('0'.repeat(64));
    });

    it('should add a new block correctly', async () => {
        const latestBlock = blockchain.getLatestBlock();
        const newBlock: Block = {
            height: 1,
            timestamp: Date.now(),
            transactions: [],
            previousHash: latestBlock.hash,
            validator: 'test-validator',
            signature: 'test-signature',
            hash: '',
            totalFees: 0,
        };
        newBlock.hash = crypto.hash(JSON.stringify({
            height: newBlock.height,
            timestamp: newBlock.timestamp,
            transactions: newBlock.transactions,
            previousHash: newBlock.previousHash,
            totalFees: newBlock.totalFees,
        }));
        
        // Mock a valid signature for testing
        // In a real scenario, this would involve a validator instance.
        newBlock.signature = 'mock-valid-signature';
        // FIX: Use an ES module import and `jest.spyOn` to avoid errors with `require`.
        const verifyMock = jest.spyOn(crypto, 'verify').mockReturnValue(true);

        const result = await blockchain.addBlock(newBlock);
        expect(result).toBe(true);

        const updatedLatestBlock = blockchain.getLatestBlock();
        expect(updatedLatestBlock.height).toBe(1);
        expect(updatedLatestBlock.hash).toBe(newBlock.hash);
        
        verifyMock.mockRestore();
    });
    
    it('should not add an invalid block', async () => {
        const newBlock: Block = {
            height: 2, // Invalid height
            timestamp: Date.now(),
            transactions: [],
            previousHash: 'invalid-hash',
            validator: 'test-validator',
            signature: 'test-signature',
            hash: 'some-hash',
            totalFees: 0,
        };
        
        const result = await blockchain.addBlock(newBlock);
        expect(result).toBe(false);
        expect(blockchain.getLatestBlock().height).toBe(0);
    });
});