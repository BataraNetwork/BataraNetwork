// core/node/tests/vm/wasmEngine.test.ts

import { describe, beforeEach, it, expect } from '@jest/globals';
import { WasmEngine } from '../../src/vm/wasmEngine';
import { ContractCreationTransaction, ContractCallTransaction, TransactionType } from '../../src/types';

describe('WasmEngine', () => {
    let wasmEngine: WasmEngine;

    const createDeployTx = (initialState?: Record<string, any>): ContractCreationTransaction => ({
        id: 'tx-deploy',
        from: 'deployer-address',
        nonce: 0,
        signature: 'sig-deploy',
        type: TransactionType.CONTRACT_CREATION,
        code: 'base64-wasm-code',
        fee: 10,
        initialState,
    });

    const createCallTx = (contractId: string, func: string, args: any[]): ContractCallTransaction => ({
        id: 'tx-call',
        from: 'caller-address',
        nonce: 1,
        signature: 'sig-call',
        type: TransactionType.CONTRACT_CALL,
        contractId,
        function: func,
        args,
        fee: 2,
    });

    beforeEach(() => {
        wasmEngine = new WasmEngine();
    });

    it('should deploy a contract without an initial state', () => {
        const tx = createDeployTx();
        const contractId = wasmEngine.deployContract(tx);
        
        expect(contractId).toBeDefined();
        expect(typeof contractId).toBe('string');

        // Simulate a call to get the state
        const state = wasmEngine.executeContract(createCallTx(contractId, 'getState', []));
        expect(state).toEqual({});
    });

    it('should deploy a contract with an initial state', () => {
        const initialState = { owner: 'deployer-address', count: 42 };
        const tx = createDeployTx(initialState);
        const contractId = wasmEngine.deployContract(tx);

        const state = wasmEngine.executeContract(createCallTx(contractId, 'getState', []));
        expect(state).toEqual(initialState);
    });

    it('should execute setState and update the contract state', () => {
        const contractId = wasmEngine.deployContract(createDeployTx());
        
        // Set a new key-value pair
        const setStateTx = createCallTx(contractId, 'setState', ['message', 'hello world']);
        const setResult = wasmEngine.executeContract(setStateTx);
        
        expect(setResult.success).toBe(true);
        expect(setResult.newState).toEqual({ message: 'hello world' });

        // Verify the state was updated
        const finalState = wasmEngine.executeContract(createCallTx(contractId, 'getState', []));
        expect(finalState).toEqual({ message: 'hello world' });
    });

    it('should overwrite an existing key when setState is called again', () => {
        const contractId = wasmEngine.deployContract(createDeployTx({ counter: 1 }));
        
        const setStateTx = createCallTx(contractId, 'setState', ['counter', 2]);
        wasmEngine.executeContract(setStateTx);

        const finalState = wasmEngine.executeContract(createCallTx(contractId, 'getState', []));
        expect(finalState).toEqual({ counter: 2 });
    });

    it('should throw an error when calling a function on a non-existent contract', () => {
        const callTx = createCallTx('non-existent-id', 'someFunction', []);
        expect(() => wasmEngine.executeContract(callTx)).toThrow('Contract with ID non-existent-id not found.');
    });

    it('should return a generic success message for a non-simulated function call', () => {
        const contractId = wasmEngine.deployContract(createDeployTx());
        const callTx = createCallTx(contractId, 'unknownFunction', [1, 2, 3]);
        
        const result = wasmEngine.executeContract(callTx);
        expect(result.success).toBe(true);
        expect(result.message).toBe("Function 'unknownFunction' executed.");
    });
});
