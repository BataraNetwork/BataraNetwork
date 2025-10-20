// core/node/src/state/stateManager.ts

import { LevelStorage } from '../storage/level';
import { Account, Transaction, TransactionType, ContractState } from '../types';

/**
 * Manages the world state of the blockchain, such as account balances and nonces.
 * This class is responsible for reading and writing state to the underlying storage
 * and validating state transitions based on transactions.
 */
export class StateManager {
  constructor(private storage: LevelStorage) {
    console.log('State Manager initialized.');
  }

  /**
   * Initializes the genesis state if no accounts exist in the database.
   * @param genesisAccounts An array of accounts to fund at the start of the chain.
   */
  public async initializeGenesisState(genesisAccounts: { address: string; balance: number }[]): Promise<void> {
    const firstAccount = await this.storage.getAccount(genesisAccounts[0].address);
    if (firstAccount) {
      console.log('Genesis state already exists. Skipping initialization.');
      return;
    }
    console.log('Initializing genesis state...');
    for (const acc of genesisAccounts) {
      const newAccount: Account = {
        address: acc.address,
        balance: acc.balance,
        nonce: 0,
      };
      await this.storage.saveAccount(newAccount);
      console.log(`  - Funded genesis account ${acc.address.substring(0, 15)}... with ${acc.balance}`);
    }
  }

  public async getAccount(address: string): Promise<Account> {
    const account = await this.storage.getAccount(address);
    if (account) {
      return account;
    }
    // Return a default, zero-balance account if it doesn't exist
    return { address, balance: 0, nonce: 0 };
  }

  /**
   * Applies a transaction to the world state, validating it and updating account balances and nonces.
   * @param tx The transaction to apply.
   * @returns A boolean indicating if the transaction was applied successfully.
   */
  public async applyTransaction(tx: Transaction): Promise<boolean> {
    const sender = await this.getAccount(tx.from);

    // 1. Nonce check
    if (tx.nonce !== sender.nonce) {
      console.error(`[State Validation Failed] Invalid nonce for tx ${tx.id}. Expected ${sender.nonce}, got ${tx.nonce}.`);
      return false;
    }

    // 2. Balance check (for transfers, stakes, and fees)
    let amountToDebit = 0;
    if (tx.type === TransactionType.TRANSFER) {
      amountToDebit = tx.amount;
    } else if (tx.type === TransactionType.STAKE) {
      amountToDebit = tx.amount;
    }
    const cost = amountToDebit + tx.fee;

    if (sender.balance < cost) {
      console.error(`[State Validation Failed] Insufficient funds for tx ${tx.id}. Sender has ${sender.balance}, needs ${cost}.`);
      return false;
    }

    // 3. Apply state changes
    sender.balance -= cost;
    sender.nonce++;
    
    const accountsToUpdate: Account[] = [sender];
    
    if (tx.type === TransactionType.TRANSFER) {
      const receiver = await this.getAccount(tx.to);
      receiver.balance += tx.amount;
      accountsToUpdate.push(receiver);
    }
    
    // In a real implementation, fees would go to a block producer/validator account.
    // For simplicity here, we are just "burning" them from the sender's balance.

    await this.storage.batchUpdateAccounts(accountsToUpdate);
    return true;
  }

  // --- Contract State Management ---

  /**
   * Retrieves the state for a given smart contract.
   * @param contractId The ID of the contract.
   * @returns The contract's state, or an empty object if it doesn't exist.
   */
  public async getContractState(contractId: string): Promise<ContractState> {
    const state = await this.storage.getContractState(contractId);
    return state || {};
  }

  /**
   * Saves the state for a given smart contract.
   * @param contractId The ID of the contract.
   * @param state The new state to save.
   */
  public async saveContractState(contractId: string, state: ContractState): Promise<void> {
    await this.storage.saveContractState(contractId, state);
  }
}