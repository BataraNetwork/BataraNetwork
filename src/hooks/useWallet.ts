import { useState, useCallback, useEffect } from 'react';
import { WalletTransaction, User } from '../types';

interface WalletState {
    address: string;
    balance: number;
    transactions: WalletTransaction[];
}

const initialWalletStates: Record<string, WalletState> = {
    '1': { // Alice (DevOps)
        address: '0xDevOps...a1b2c3',
        balance: 5000,
        transactions: [
            { id: 'tx1', type: 'receive', from: '0xNetwork...d4e5f6', to: '0xDevOps...a1b2c3', amount: 1000, status: 'completed', timestamp: new Date(Date.now() - 86400000).toLocaleString() }
        ],
    },
    '2': { // Bob (Developer)
        address: '0xDev...d4e5f6',
        balance: 1200,
        transactions: [],
    },
    '3': { // Charlie (Auditor)
        address: '0xAudit...g7h8i9',
        balance: 500,
        transactions: [],
    },
    '4': { // Dana (Admin)
        address: '0xAdmin...jKlM0p',
        balance: 100000,
        transactions: [],
    }
};


export const useWallet = (currentUser: User) => {
    const [walletState, setWalletState] = useState<WalletState>(initialWalletStates[currentUser.id]);
    
    useEffect(() => {
        // Switch wallet state when the user changes
        setWalletState(initialWalletStates[currentUser.id]);
    }, [currentUser.id]);

    const sendBtr = useCallback((to: string, amount: number): { success: boolean, message: string } => {
        if (amount <= 0) {
            return { success: false, message: 'Amount must be positive.' };
        }
        if (walletState.balance < amount) {
            return { success: false, message: 'Insufficient balance.' };
        }
        
        const newTx: WalletTransaction = {
            id: crypto.randomUUID(),
            type: 'send',
            from: walletState.address,
            to,
            amount,
            status: 'completed',
            timestamp: new Date().toLocaleString(),
        };
        
        const newState: WalletState = {
            ...walletState,
            balance: walletState.balance - amount,
            transactions: [newTx, ...walletState.transactions],
        };
        
        // Update the central store and the local state
        initialWalletStates[currentUser.id] = newState;
        setWalletState(newState);

        return { success: true, message: 'Transaction successful!' };

    }, [walletState, currentUser.id]);

    return { 
        balance: walletState.balance, 
        address: walletState.address,
        transactions: walletState.transactions,
        sendBtr
    };
};