import { useState, useCallback, useEffect } from 'react';
import { WalletTransaction, User } from '../types';
import { nodeService } from '../services/nodeService';

interface WalletState {
    balance: number;
    nonce: number;
    transactions: WalletTransaction[];
}

// Transaction history is now the only simulated part.
const initialTransactionHistory: Record<string, WalletTransaction[]> = {
    '1': [{ id: 'tx1', type: 'receive', from: '0xNetwork...d4e5f6', to: '0xDevOps...a1b2c3', amount: 1000, status: 'completed', timestamp: new Date(Date.now() - 86400000).toLocaleString() }],
    '2': [],
    '3': [],
    '4': [],
};

export const useWallet = (currentUser: User) => {
    const [balance, setBalance] = useState(0);
    const [nonce, setNonce] = useState(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(initialTransactionHistory[currentUser.id] || []);
    
    // Fetch live balance and nonce from the backend node
    const fetchAccountState = useCallback(async () => {
        try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            setBalance(account.balance);
            setNonce(account.nonce);
        } catch (error) {
            console.error(`Failed to fetch account state for ${currentUser.name}:`, error);
            // In case of error, reset to 0 to avoid showing stale data
            setBalance(0);
            setNonce(0);
        }
    }, [currentUser.publicKey, currentUser.name]);

    useEffect(() => {
        fetchAccountState();
        // Also switch transaction history when user changes
        setTransactions(initialTransactionHistory[currentUser.id] || []);
        
        const interval = setInterval(fetchAccountState, 5000); // Poll for balance updates
        return () => clearInterval(interval);
    }, [currentUser.id, fetchAccountState]);

    // SendBtr is now just a simulation of adding to the local history,
    // as the actual balance update will be fetched from the node after the transaction is processed.
    const addSentTransactionToHistory = useCallback((to: string, amount: number) => {
        const newTx: WalletTransaction = {
            id: crypto.randomUUID(),
            type: 'send',
            from: currentUser.publicKey,
            to,
            amount,
            status: 'pending', // Assume pending until it's confirmed in a block
            timestamp: new Date().toLocaleString(),
        };
        
        // Update the central store and the local state for transaction history
        if (!initialTransactionHistory[currentUser.id]) {
            initialTransactionHistory[currentUser.id] = [];
        }
        initialTransactionHistory[currentUser.id].unshift(newTx);
        setTransactions(prev => [newTx, ...prev]);

    }, [currentUser.id, currentUser.publicKey]);

    return { 
        balance, 
        nonce,
        address: currentUser.publicKey,
        transactions,
        addSentTransactionToHistory,
    };
};