// FIX: Import `jest` from `@jest/globals` to resolve type errors.
import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import { Blockchain } from '../src/blockchain';
import { LevelStorage } from '../src/storage/level';
// FIX: Import TransactionType to be used in test data.
import { Account, Block, Transaction, TransactionType, TransferTransaction } from '../src/types';
import * as crypto from '../src/utils/crypto';
import * as fs from 'fs';
import { Mempool } from '../src/mempool';
// FIX: Import required dependencies for the Blockchain constructor.
import { StakingManager } from '../src/staking/stakingManager';
import { WasmEngine } from '../src/vm/wasmEngine';
import { GovernanceModule } from '../src/governance/governanceModule';
import { StateManager } from '../src/state/stateManager';

const TEST_DB_PATH = './test-db';

describe('Blockchain', () => {
    let storage: LevelStorage;
    let mempool: Mempool;
    let blockchain: Blockchain;
    let verifyMock: jest.SpyInstance;
    let stakingManager: StakingManager;
    let wasmEngine: WasmEngine;
    let governanceModule: GovernanceModule;
    let stateManager: StateManager;

    beforeEach(async () => {
        // Clean up database before each test
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
        storage = new LevelStorage(TEST_DB_PATH);
        await storage.open();
        mempool = new Mempool();
        stakingManager = new StakingManager([]);
        governanceModule = new GovernanceModule();
        // Instantiate the new StateManager
        stateManager = new StateManager(storage);
        // FIX: The WasmEngine constructor now requires a StateManager instance.
        wasmEngine = new WasmEngine(stateManager);

        blockchain = new Blockchain(storage, mempool, stakingManager, wasmEngine, governanceModule, stateManager);
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

    it('should add a valid block with transactions and update state', async () => {
        // Setup initial state for the sender
        const senderAddress = 'sender-address';
        const receiverAddress = 'receiver-address';
        const initialSenderAccount: Account = { address: senderAddress, balance: 100, nonce: 0 };
        await storage.saveAccount(initialSenderAccount);

        const tx1: TransferTransaction = { type: TransactionType.TRANSFER, id: 'tx1', from: senderAddress, to: receiverAddress, amount: 10, fee: 1, nonce: 0, signature: 'sig1' };
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
            totalFees: 1,
        };
        newBlock.hash = crypto.hash(JSON.stringify({
            height: newBlock.height,
            timestamp: newBlock.timestamp,
            transactions: newBlock.transactions,
            previousHash: newBlock.previousHash,
            totalFees: newBlock.totalFees,
        }));
        
        // Mock the staking manager to approve the validator
        jest.spyOn(stakingManager, 'selectNextValidator').mockReturnValue('test-validator');
        
        const result = await blockchain.addBlock(newBlock);

        expect(result).toBe(true);
        const updatedLatestBlock = blockchain.getLatestBlock();
        expect(updatedLatestBlock.height).toBe(1);
        expect(updatedLatestBlock.hash).toBe(newBlock.hash);
        expect(mempool.getPendingTransactions().length).toBe(0);

        // Verify state changes
        const finalSenderAccount = await stateManager.getAccount(senderAddress);
        const finalReceiverAccount = await stateManager.getAccount(receiverAddress);
        expect(finalSenderAccount.balance).toBe(89); // 100 - 10 (amount) - 1 (fee)
        expect(finalSenderAccount.nonce).toBe(1);
        expect(finalReceiverAccount.balance).toBe(10);
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

    it('should reject a block with an invalid transaction (e.g., wrong nonce)', async () => {
        const senderAddress = 'sender-address';
        const initialSenderAccount: Account = { address: senderAddress, balance: 100, nonce: 0 };
        await storage.saveAccount(initialSenderAccount);

        // Transaction with wrong nonce (should be 0)
        const invalidTx: TransferTransaction = { type: TransactionType.TRANSFER, id: 'tx1', from: senderAddress, to: 'receiver', amount: 10, fee: 1, nonce: 1, signature: 'sig1' };

        const latestBlock = blockchain.getLatestBlock();
        const newBlock: Block = {
            height: 1,
            timestamp: Date.now(),
            transactions: [invalidTx],
            previousHash: latestBlock.hash,
            validator: 'test-validator',
            signature: 'test-signature',
            hash: '',
            totalFees: 1,
        };
        newBlock.hash = crypto.hash(JSON.stringify({
            height: newBlock.height,
            timestamp: newBlock.timestamp,
            transactions: newBlock.transactions,
            previousHash: newBlock.previousHash,
            totalFees: newBlock.totalFees,
        }));
        
        // Mock the staking manager to approve the validator
        jest.spyOn(stakingManager, 'selectNextValidator').mockReturnValue('test-validator');

        const result = await blockchain.addBlock(newBlock);
        expect(result).toBe(false);
        expect(blockchain.getLatestBlock().height).toBe(0);

        // Verify state was not changed
        const finalSenderAccount = await stateManager.getAccount(senderAddress);
        expect(finalSenderAccount.balance).toBe(100);
        expect(finalSenderAccount.nonce).toBe(0);
    });
});
