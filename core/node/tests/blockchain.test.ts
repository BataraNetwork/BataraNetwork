// FIX: Import `jest` from `@jest/globals` to resolve type errors.
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { Blockchain } from '../src/blockchain';
import { LevelStorage } from '../src/storage/level';
import { Block, Transaction } from '../src/types';
import * as crypto from '../src/utils/crypto';
import * as fs from 'fs';
import { Mempool } from '../src/mempool';

const TEST_DB_PATH = './test-db';

describe('Blockchain', () => {
    let storage: LevelStorage;
    let mempool: Mempool;
    let blockchain: Blockchain;
    let verifyMock: jest.SpyInstance;

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

        // Mock crypto.verify to always return true for these tests, as we are not testing cryptography itself.
        verifyMock = jest.spyOn(crypto, 'verify').mockReturnValue(true);
    });

    afterEach(async () => {
        await storage.close();
        verifyMock.mockRestore(); // Clean up the mock
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
    });

    it('should initialize with a genesis block', () => {
        const latestBlock = blockchain.getLatestBlock();
        expect(latestBlock).toBeDefined();
        expect(latestBlock.height).toBe(0);
        expect(latestBlock.previousHash).toBe('0'.repeat(64));
        expect(latestBlock.totalFees).toBe(0);
    });

    it('should add a valid block with transactions and remove them from the mempool', async () => {
        const tx1: Transaction = { id: 'tx1', from: 'a', to: 'b', amount: 10, fee: 1, signature: 'sig1' };
        mempool.addTransaction(tx1);
        
        const latestBlock = blockchain.getLatestBlock();
        const newBlock: Block = {
            height: 1,
            timestamp: Date.now(),
            transactions: [tx1],
            previousHash: latestBlock.hash,
            validator: 'test-validator',
            signature: 'test-signature',
            hash: '',
            totalFees: 1, // Correct fee sum
        };
        newBlock.hash = crypto.hash(JSON.stringify({
            height: newBlock.height,
            timestamp: newBlock.timestamp,
            transactions: newBlock.transactions,
            previousHash: newBlock.previousHash,
            totalFees: newBlock.totalFees,
        }));
        
        const result = await blockchain.addBlock(newBlock);

        expect(result).toBe(true);
        const updatedLatestBlock = blockchain.getLatestBlock();
        expect(updatedLatestBlock.height).toBe(1);
        expect(updatedLatestBlock.hash).toBe(newBlock.hash);
        expect(updatedLatestBlock.totalFees).toBe(1);
        expect(mempool.getPendingTransactions().length).toBe(0); // Should be removed from mempool
    });
    
    it('should reject a block with invalid height', async () => {
        const newBlock: Block = {
            height: 2, // Invalid height
            timestamp: Date.now(),
            transactions: [],
            previousHash: blockchain.getLatestBlock().hash,
            validator: 'test-validator',
            signature: 'test-signature',
            hash: 'some-hash',
            totalFees: 0,
        };
        
        const result = await blockchain.addBlock(newBlock);
        expect(result).toBe(false);
        expect(blockchain.getLatestBlock().height).toBe(0);
    });

    it('should reject a block with an incorrect hash due to wrong totalFees', async () => {
        const tx1: Transaction = { id: 'tx1', from: 'a', to: 'b', amount: 10, fee: 1, signature: 'sig1' };
        const latestBlock = blockchain.getLatestBlock();
        
        // This block is invalid because its hash is calculated with the wrong totalFees
        const blockWithBadHash: Block = {
            height: 1,
            timestamp: Date.now(),
            transactions: [tx1],
            previousHash: latestBlock.hash,
            validator: 'test-validator',
            signature: 'test-signature',
            totalFees: 1,
            hash: crypto.hash(JSON.stringify({
                height: 1,
                timestamp: Date.now(),
                transactions: [tx1],
                previousHash: latestBlock.hash,
                totalFees: 999, // Mismatched fee used for hashing
            })),
        };

        const result = await blockchain.addBlock(blockWithBadHash);
        expect(result).toBe(false);
        expect(blockchain.getLatestBlock().height).toBe(0);
    });
});