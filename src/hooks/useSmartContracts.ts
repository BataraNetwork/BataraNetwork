import { useState, useEffect, useCallback } from 'react';
import { Contract, ContractInteraction } from '../types';
import { useAuth } from './useAuth';
import { nodeService } from '../services/nodeService';
import { hash, sign } from '../utils/crypto';

enum TransactionType {
  CONTRACT_CREATION = 'CONTRACT_CREATION',
  CONTRACT_CALL = 'CONTRACT_CALL',
}

const MOCK_INTERACTIONS: ContractInteraction[] = [];

export const useSmartContracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [interactions, setInteractions] = useState<ContractInteraction[]>(MOCK_INTERACTIONS);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();
    
    const fetchContracts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await nodeService.getContracts();
            // The backend doesn't return balance or methods, so we add mock data for UI.
            const augmentedContracts = data.map((c: any) => ({
                id: c.id,
                name: `Contract-${c.id.substring(0, 6)}`,
                address: c.id,
                balance: Math.floor(Math.random() * 1000),
                methods: ['getState()', 'setState(key, value)', 'increment()']
            }));
            setContracts(augmentedContracts);
        } catch (e) {
            console.error("Failed to fetch contracts:", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
        const interval = setInterval(fetchContracts, 10000);
        return () => clearInterval(interval);
    }, [fetchContracts]);

    const callMethod = useCallback(async (contractId: string, method: string, params: any[]) => {
        try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            const functionName = method.split('(')[0];

            const txData = {
                from: currentUser.publicKey,
                contractId,
                function: functionName,
                args: params,
                nonce: account.nonce,
                fee: 5,
                type: TransactionType.CONTRACT_CALL,
            };
            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            const transaction = { ...txData, id: txId, signature };

            const result = await nodeService.broadcastTransaction(transaction);

            const newInteraction: ContractInteraction = {
                id: MOCK_INTERACTIONS.length + 1,
                contractId,
                method,
                params,
                result,
                timestamp: new Date().toLocaleString(),
            };
            MOCK_INTERACTIONS.unshift(newInteraction);
            setInteractions([...MOCK_INTERACTIONS]);
            return newInteraction;
        } catch (e: any) {
            console.error("Contract call failed:", e);
            return null;
        }
    }, [currentUser]);

    const deployContract = useCallback(async (name: string, bytecode: string, initialState: string) => {
        try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            let parsedInitialState = {};
            try {
                if (initialState) parsedInitialState = JSON.parse(initialState);
            } catch {
                console.error("Invalid JSON for initial state.");
                // We could return an error here.
            }

            const txData = {
                from: currentUser.publicKey,
                code: bytecode, // In reality, this would be base64 encoded WASM
                initialState: parsedInitialState,
                nonce: account.nonce,
                fee: 25, // Higher fee for deployment
                type: TransactionType.CONTRACT_CREATION,
            };
            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            const transaction = { ...txData, id: txId, signature };
            
            await nodeService.broadcastTransaction(transaction);
            // We can't know the contract ID here, but we can refetch or just return the tx.
            return transaction;
        } catch (e) {
            console.error("Contract deployment failed:", e);
            return null;
        }
    }, [currentUser]);

    return { contracts, interactions, callMethod, deployContract, isLoading };
};
