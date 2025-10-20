import { useState, useEffect, useCallback } from 'react';
import { Validator } from '../types';
import { useAuth } from './useAuth';
import { nodeService } from '../services/nodeService';
import { hash, sign } from '../utils/crypto';

enum TransactionType {
  STAKE = 'STAKE',
}

export const useStaking = () => {
    const [validators, setValidators] = useState<Validator[]>([]);
    const [totalStaked, setTotalStaked] = useState(0);
    const [stakedAmount, setStakedAmount] = useState(0); // This is simulated for the user
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    const fetchValidators = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await nodeService.getValidators();
            setValidators(data);
            const total = data.reduce((sum: number, v: { stake: number }) => sum + v.stake, 0);
            setTotalStaked(total);
        } catch (error) {
            console.error("Failed to fetch validators:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchValidators();
        const interval = setInterval(fetchValidators, 10000);
        return () => clearInterval(interval);
    }, [fetchValidators]);
    
    const stakeTokens = useCallback(async (validatorAddress: string, amount: number) => {
        try {
            const account = await nodeService.getAccount(currentUser.publicKey);
            if (account.balance < amount + 2) { // 2 is fee
                return { success: false, message: 'Insufficient funds for stake + fee.' };
            }
            const txData = {
                from: currentUser.publicKey,
                validator: validatorAddress,
                amount: amount,
                nonce: account.nonce,
                fee: 2,
                type: TransactionType.STAKE,
            };
            const txId = hash(txData);
            const signature = sign(txId, currentUser.privateKey);
            
            await nodeService.broadcastTransaction({ ...txData, id: txId, signature });
            setStakedAmount(prev => prev + amount); // Optimistic update
            return { success: true, message: 'Stake transaction broadcasted.' };
        } catch (error: any) {
            console.error("Staking failed:", error);
            return { success: false, message: error.response?.data?.error || 'Broadcast failed.' };
        }
    }, [currentUser]);

    const unstakeTokens = useCallback(async (validatorAddress: string, amount: number) => {
        // The backend doesn't have an "unstake" transaction type, so we simulate it on the frontend.
        // A real implementation would require a specific transaction type.
        if (amount > stakedAmount) {
            return { success: false, message: 'Cannot unstake more than you have staked.' };
        }
        setStakedAmount(prev => prev - amount);
        return { success: true, message: 'Unstake successful (simulated).' };
    }, [stakedAmount]);

    return { validators, totalStaked, stakedAmount, stakeTokens, unstakeTokens, isLoading };
};
