import { useState, useCallback } from 'react';
import { Validator } from '../types';

const MOCK_VALIDATORS: Validator[] = [
    { address: '0xValidator...1a2b3c', name: 'CosmoStation', stake: 12500000, commission: 5, uptime: 99.98, status: 'active' },
    { address: '0xValidator...4d5e6f', name: 'Everstake', stake: 11800000, commission: 7, uptime: 99.99, status: 'active' },
    { address: '0xValidator...7g8h9i', name: 'Figment', stake: 9500000, commission: 10, uptime: 99.95, status: 'active' },
    { address: '0xValidator...jKlM0p', name: 'Chorus One', stake: 8750000, commission: 8, uptime: 99.97, status: 'active' },
    { address: '0xValidator...qRsTuV', name: 'P2P.org', stake: 7600000, commission: 6, uptime: 99.96, status: 'active' },
    { address: '0xValidator...wXyZ12', name: 'Inactive Node', stake: 150000, commission: 100, uptime: 75.2, status: 'inactive' },
];

let personalStake = 0;

export const useStaking = () => {
    const [validators, setValidators] = useState<Validator[]>(MOCK_VALIDATORS);
    const [stakedAmount, setStakedAmount] = useState(personalStake);

    const totalStaked = validators.reduce((acc, v) => acc + v.stake, 0);

    const stakeTokens = useCallback((validatorAddress: string, amount: number) => {
        setValidators(prev => prev.map(v => 
            v.address === validatorAddress ? { ...v, stake: v.stake + amount } : v
        ));
        personalStake += amount;
        setStakedAmount(personalStake);
    }, []);
    
    const unstakeTokens = useCallback((validatorAddress: string, amount: number) => {
        // Basic simulation, doesn't handle staking less than amount
        setValidators(prev => prev.map(v => 
            v.address === validatorAddress ? { ...v, stake: v.stake - amount } : v
        ));
        personalStake -= amount;
        setStakedAmount(personalStake);
    }, []);

    return { validators, totalStaked, stakedAmount, stakeTokens, unstakeTokens };
};