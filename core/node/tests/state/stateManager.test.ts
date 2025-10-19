// core/node/tests/state/stateManager.test.ts

import { describe, beforeEach, afterEach, it, expect } from '@jest/globals';
import * as fs from 'fs';
import { LevelStorage } from '../../src/storage/level';
import { StateManager } from '../../src/state/stateManager';
import { Account, StakeTransaction, TransactionType, TransferTransaction } from '../../src/types';

const TEST_DB_PATH = './test-db-state-manager';

describe('StateManager', () => {
    let storage: LevelStorage;
    let stateManager: StateManager;

    const senderAddress = 'sender-address';
    const receiverAddress = 'receiver-address';
    const validatorAddress = 'validator-address';

    beforeEach(async () => {
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
        storage = new LevelStorage(TEST_DB_PATH);
        await storage.open();
        stateManager = new StateManager(storage);

        // Setup a pre-funded sender account for each test
        const initialSenderAccount: Account = {
            address: senderAddress,
            balance: 1000,
            nonce: 0,
        };
        await storage.saveAccount(initialSenderAccount);
    });

    afterEach(async () => {
        await storage.close();
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.rmSync(TEST_DB_PATH, { recursive: true, force: true });
        }
    });

    it('should retrieve an existing account', async () => {
        const account = await stateManager.getAccount(senderAddress);
        expect(account.balance).toBe(1000);
        expect(account.nonce).toBe(0);
    });

    it('should return a default account for a non-existent address', async () => {
        const account = await stateManager.getAccount('non-existent-address');
        expect(account.balance).toBe(0);
        expect(account.nonce).toBe(0);
    });

    it('should successfully apply a valid transfer transaction', async () => {
        const tx: TransferTransaction = {
            id: 'tx-transfer',
            from: senderAddress,
            to: receiverAddress,
            amount: 100,
            fee: 10,
            nonce: 0,
            signature: 'sig',
            type: TransactionType.TRANSFER,
        };

        const result = await stateManager.applyTransaction(tx);
        expect(result).toBe(true);

        const sender = await stateManager.getAccount(senderAddress);
        const receiver = await stateManager.getAccount(receiverAddress);

        expect(sender.balance).toBe(890); // 1000 - 100 - 10
        expect(sender.nonce).toBe(1);
        expect(receiver.balance).toBe(100);
    });

    it('should successfully apply a valid stake transaction', async () => {
        const tx: StakeTransaction = {
            id: 'tx-stake',
            from: senderAddress,
            validator: validatorAddress,
            amount: 500,
            fee: 20,
            nonce: 0,
            signature: 'sig',
            type: TransactionType.STAKE,
        };

        const result = await stateManager.applyTransaction(tx);
        expect(result).toBe(true);
        
        const sender = await stateManager.getAccount(senderAddress);
        expect(sender.balance).toBe(480); // 1000 - 500 - 20
        expect(sender.nonce).toBe(1);
    });

    it('should reject a transaction with an incorrect nonce', async () => {
        const tx: TransferTransaction = {
            id: 'tx-wrong-nonce',
            from: senderAddress,
            to: receiverAddress,
            amount: 100,
            fee: 10,
            nonce: 1, // Incorrect nonce, should be 0
            signature: 'sig',
            type: TransactionType.TRANSFER,
        };
        
        const result = await stateManager.applyTransaction(tx);
        expect(result).toBe(false);

        const sender = await stateManager.getAccount(senderAddress);
        expect(sender.balance).toBe(1000); // State should not change
        expect(sender.nonce).toBe(0);
    });
    
    it('should reject a transfer transaction with insufficient funds', async () => {
        const tx: TransferTransaction = {
            id: 'tx-insufficient-funds',
            from: senderAddress,
            to: receiverAddress,
            amount: 990,
            fee: 11, // Total cost is 1001, balance is 1000
            nonce: 0,
            signature: 'sig',
            type: TransactionType.TRANSFER,
        };

        const result = await stateManager.applyTransaction(tx);
        expect(result).toBe(false);

        const sender = await stateManager.getAccount(senderAddress);
        expect(sender.balance).toBe(1000); // State should not change
    });
    
    it('should reject a stake transaction with insufficient funds', async () => {
        const tx: StakeTransaction = {
            id: 'tx-insufficient-funds-stake',
            from: senderAddress,
            validator: validatorAddress,
            amount: 1000,
            fee: 1, // Total cost 1001, balance is 1000
            nonce: 0,
            signature: 'sig',
            type: TransactionType.STAKE,
        };
        
        const result = await stateManager.applyTransaction(tx);
        expect(result).toBe(false);

        const sender = await stateManager.getAccount(senderAddress);
        expect(sender.balance).toBe(1000); // State should not change
    });
    
    it('should handle multiple transactions correctly, updating nonce and balance', async () => {
        const tx1: TransferTransaction = { id: 'tx1', from: senderAddress, to: receiverAddress, amount: 100, fee: 10, nonce: 0, signature: 'sig1', type: TransactionType.TRANSFER };
        const tx2: StakeTransaction = { id: 'tx2', from: senderAddress, validator: validatorAddress, amount: 200, fee: 5, nonce: 1, signature: 'sig2', type: TransactionType.STAKE };

        // Apply first transaction
        const result1 = await stateManager.applyTransaction(tx1);
        expect(result1).toBe(true);

        const senderAfterTx1 = await stateManager.getAccount(senderAddress);
        expect(senderAfterTx1.balance).toBe(890);
        expect(senderAfterTx1.nonce).toBe(1);

        // Apply second transaction
        const result2 = await stateManager.applyTransaction(tx2);
        expect(result2).toBe(true);

        const senderAfterTx2 = await stateManager.getAccount(senderAddress);
        expect(senderAfterTx2.balance).toBe(685); // 890 - 200 - 5
        expect(senderAfterTx2.nonce).toBe(2);
    });
});