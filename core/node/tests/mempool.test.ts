import { describe, beforeEach, it, expect } from '@jest/globals';
import { Mempool } from '../src/mempool';
import { Transaction, TransactionType, TransferTransaction } from '../src/types';

describe('Mempool', () => {
    let mempool: Mempool;

    const createTx = (id: string, fee: number, nonce: number): TransferTransaction => ({
        id,
        from: 'from-address',
        to: 'to-address',
        amount: 10,
        fee,
        nonce,
        signature: `sig-${id}`,
        type: TransactionType.TRANSFER,
    });

    beforeEach(() => {
        mempool = new Mempool();
    });

    it('should add a valid transaction', () => {
        const tx1 = createTx('tx1', 1, 0);
        const result = mempool.addTransaction(tx1);
        expect(result).toBe(true);
        expect(mempool.getPendingTransactions()).toHaveLength(1);
        expect(mempool.getPendingTransactions()[0]).toEqual(tx1);
    });

    it('should reject a duplicate transaction', () => {
        const tx1 = createTx('tx1', 1, 0);
        mempool.addTransaction(tx1);
        const result = mempool.addTransaction(tx1); // Add again
        expect(result).toBe(false);
        expect(mempool.getPendingTransactions()).toHaveLength(1);
    });

    it('should reject a transaction with a negative fee', () => {
        const tx = createTx('tx-invalid', -1, 0);
        const result = mempool.addTransaction(tx);
        expect(result).toBe(false);
        expect(mempool.getPendingTransactions()).toHaveLength(0);
    });

    it('should reject a transaction with a non-integer nonce', () => {
        const tx = createTx('tx-invalid', 1, 1.5);
        const result = mempool.addTransaction(tx);
        expect(result).toBe(false);
        expect(mempool.getPendingTransactions()).toHaveLength(0);
    });
    
    it('should reject a transaction with a zero amount', () => {
        const tx = { ...createTx('tx-invalid', 1, 0), amount: 0 };
        const result = mempool.addTransaction(tx);
        expect(result).toBe(false);
        expect(mempool.getPendingTransactions()).toHaveLength(0);
    });

    it('should reject a transaction without a signature', () => {
        const tx = { ...createTx('tx-invalid', 1, 0) };
        delete (tx as any).signature;
        const result = mempool.addTransaction(tx as Transaction);
        expect(result).toBe(false);
        expect(mempool.getPendingTransactions()).toHaveLength(0);
    });

    it('should return pending transactions sorted by fee descending', () => {
        const tx1 = createTx('tx1', 1, 0);
        const tx2 = createTx('tx2', 5, 0);
        const tx3 = createTx('tx3', 2, 0);

        mempool.addTransaction(tx1);
        mempool.addTransaction(tx2);
        mempool.addTransaction(tx3);

        const pending = mempool.getPendingTransactions();
        expect(pending).toHaveLength(3);
        expect(pending[0].id).toBe('tx2'); // Highest fee
        expect(pending[1].id).toBe('tx3');
        expect(pending[2].id).toBe('tx1'); // Lowest fee
    });

    it('should remove specified transactions', () => {
        const tx1 = createTx('tx1', 1, 0);
        const tx2 = createTx('tx2', 5, 0);
        const tx3 = createTx('tx3', 2, 0);
        mempool.addTransaction(tx1);
        mempool.addTransaction(tx2);
        mempool.addTransaction(tx3);

        mempool.removeTransactions([tx1, tx3]);

        const pending = mempool.getPendingTransactions();
        expect(pending).toHaveLength(1);
        expect(pending[0].id).toBe('tx2');
    });

    it('should handle removing transactions that are not in the mempool', () => {
        const tx1 = createTx('tx1', 1, 0);
        const tx2 = createTx('tx2', 5, 0);
        mempool.addTransaction(tx1);

        mempool.removeTransactions([tx2]); // tx2 is not in the mempool

        expect(mempool.getPendingTransactions()).toHaveLength(1);
    });
});