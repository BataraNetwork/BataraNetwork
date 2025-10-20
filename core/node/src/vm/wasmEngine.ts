// core/node/src/vm/wasmEngine.ts

import { ContractCreationTransaction, ContractCallTransaction, ContractState } from '../types';
import crypto from 'crypto';
import { StateManager } from '../state/stateManager';

/**
 * Simulates a WebAssembly (WASM) Smart Contract Engine.
 *
 * This class provides the architectural hooks for smart contract functionality
 * without implementing a full-blown WASM runtime. It interacts with the
 * StateManager to persist contract state.
 */
export class WasmEngine {
  // In-memory representation of deployed contracts for API discovery
  private deployedContracts = new Map<string, { from: string, code: string }>();

  constructor(private stateManager: StateManager) {
    console.log('WASM Smart Contract Engine initialized (simulation).');
  }

  /**
   * Simulates the deployment of a new smart contract and persists its initial state.
   * @param tx The contract creation transaction.
   * @returns The ID of the newly created contract.
   */
  public async deployContract(tx: ContractCreationTransaction): Promise<string> {
    console.log(`Deploying new WASM contract from ${tx.from}...`);
    // Generate a deterministic contract ID based on the sender and a nonce/timestamp.
    const contractId = crypto.createHash('sha256').update(tx.from + tx.code + Date.now()).digest('hex');
    
    const initialState = tx.initialState || {};
    
    await this.stateManager.saveContractState(contractId, initialState);
    this.deployedContracts.set(contractId, { from: tx.from, code: tx.code });
    
    console.log(`Contract deployed successfully with ID: ${contractId}`);
    return contractId;
  }

  /**
   * Simulates the execution of a function on a deployed smart contract,
   * loading its state before and saving it after execution.
   * @param tx The contract call transaction.
   * @returns The result of the function call.
   */
  public async executeContract(tx: ContractCallTransaction): Promise<any> {
    const contractState = await this.stateManager.getContractState(tx.contractId);

    console.log(`Executing function '${tx.function}' on contract ${tx.contractId} with args:`, tx.args);

    // --- SIMULATION LOGIC ---
    // This is a placeholder for actual WASM execution. We can simulate a few common functions.
    let result: any;
    // Create a mutable copy of the state to modify during execution
    const finalState: ContractState = { ...contractState };

    switch (tx.function) {
      case 'getState':
        result = finalState;
        break; // No state change needed
      case 'setState':
        const [key, value] = tx.args;
        if (typeof key !== 'string') throw new Error('First argument for setState must be a string key.');
        finalState[key] = value;
        result = { success: true, newState: finalState };
        break;
      default:
        // In a real VM, you would execute the WASM code here.
        console.warn(`Function '${tx.function}' is not a built-in simulation function. Returning success.`);
        result = { success: true, message: `Function '${tx.function}' executed.` };
        break; // No state change in this simulation
    }

    // Persist the potentially modified state back to storage
    await this.stateManager.saveContractState(tx.contractId, finalState);

    return result;
  }

  /**
   * Returns a list of all contracts deployed during this node's runtime.
   * Note: This is an in-memory list and will reset on node restart.
   */
  public getDeployedContracts() {
    return Array.from(this.deployedContracts.entries()).map(([id, data]) => ({ id, ...data }));
  }
}