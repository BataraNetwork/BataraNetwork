// FIX: Created missing useSmartContracts.ts file.
import { useState, useCallback, useEffect } from 'react';
import { DeployedContract, ContractState } from '../types';
import { nodeService } from '../services/nodeService';
import { useAuth } from './useAuth';
import { hash, sign } from '../utils/crypto';

enum TransactionType {
  CONTRACT_CREATION = 'CONTRACT_CREATION',
  CONTRACT_CALL = 'CONTRACT_CALL',
}

export const useSmartContracts = () => {
    const [contracts, setContracts] = useState<DeployedContract[]>([]);
    const [contractStates, setContractStates] = useState<Record<string, ContractState>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    const fetchContracts = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await nodeService.getDeployedContracts();
            setContracts(data);
        } catch (error) {
            console.error("Failed to fetch contracts:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContracts();
        const interval = setInterval(fetchContracts, 10000); // Poll for new contracts
        return () => clearInterval(interval);
    }, [fetchContracts]);

    const fetchContractState = useCallback(async (contractId: string) => {
        try {
            const state = await nodeService.getContractState(contractId);
            setContractStates(prev => ({ ...prev, [contractId]: state }));
        } catch (error) {
            console.error(`Failed to fetch state for contract ${contractId}:`, error);
        }
    }, []);

    const deployContract = useCallback(async (code: string, initialState?: Record<string, any>) => {
        try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            const txData = {
                from: currentUser.publicKey,
                code, // Base64 encoded WASM
                initialState,
                nonce: account.nonce,
                fee: 50, // Higher fee for deployment
                type: TransactionType.CONTRACT_CREATION,
            };

            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            const transaction = { ...txData, id: txId, signature };

            await nodeService.broadcastTransaction(transaction);
            // Optimistic update
            setTimeout(fetchContracts, 5000); // Re-fetch after a delay
            return { success: true, message: 'Deployment transaction broadcasted.' };
        } catch (error: any) {
            console.error("Failed to deploy contract:", error);
            return { success: false, message: error.response?.data?.error || 'Broadcast failed.' };
        }
    }, [currentUser, fetchContracts]);
    
    const callContract = useCallback(async (contractId: string, func: string, args: any[]) => {
         try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            const txData = {
                from: currentUser.publicKey,
                contractId,
                function: func,
                args,
                nonce: account.nonce,
                fee: 5,
                type: TransactionType.CONTRACT_CALL,
            };
            
            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            const transaction = { ...txData, id: txId, signature };

            await nodeService.broadcastTransaction(transaction);
            setTimeout(() => fetchContractState(contractId), 5000); // Re-fetch state
            return { success: true, message: 'Contract call transaction broadcasted.' };
        } catch (error: any) {
            console.error("Failed to call contract:", error);
            return { success: false, message: error.response?.data?.error || 'Broadcast failed.' };
        }
    }, [currentUser, fetchContractState]);


    return {
        contracts,
        contractStates,
        isLoading,
        fetchContractState,
        deployContract,
        callContract
    };
};
