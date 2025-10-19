
import { Transaction } from './types';

export class Mempool {
  private pendingTransactions: Map<string, Transaction> = new Map();

  public addTransaction(transaction: Transaction): boolean {
    // Basic validation checks
    if (!transaction || !transaction.id) {
        console.error('Invalid transaction: Missing transaction or transaction ID.');
        return false;
    }
    if (!transaction.from) {
        console.error(`Invalid transaction ${transaction.id}: 'from' address is missing.`);
        return false;
    }
    if (!transaction.to) {
        console.error(`Invalid transaction ${transaction.id}: 'to' address is missing.`);
        return false;
    }
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        console.error(`Invalid transaction ${transaction.id}: Amount must be a positive number.`);
        return false;
    }
    if (typeof transaction.fee !== 'number' || transaction.fee < 0) {
        console.error(`Invalid transaction ${transaction.id}: Fee must be a non-negative number.`);
        return false;
    }
    if (!transaction.signature) {
        console.error(`Invalid transaction ${transaction.id}: Signature is missing.`);
        return false;
    }

    if (this.pendingTransactions.has(transaction.id)) {
      return false; // Transaction already exists, no need to log as an error.
    }

    this.pendingTransactions.set(transaction.id, transaction);
    console.log(`Transaction ${transaction.id.substring(0, 10)}... added to mempool.`);
    return true;
  }

  public removeTransactions(transactions: Transaction[]): void {
    for (const tx of transactions) {
      if (this.pendingTransactions.has(tx.id)) {
        this.pendingTransactions.delete(tx.id);
      }
    }
  }

  public getPendingTransactions(): Transaction[] {
    // Return a copy, sorted by fee in descending order
    return Array.from(this.pendingTransactions.values()).sort((a, b) => b.fee - a.fee);
  }

  public getAll(): Transaction[] {
    return this.getPendingTransactions();
  }
}