import { useState, useCallback } from 'react';

export interface Contract {
    id: string;
    name: string;
    address: string;
    balance: number;
    methods: string[];
}

export interface ContractInteraction {
    id: number;
    contractId: string;
    method: string;
    params: any[];
    result: any;
    timestamp: string;
}

const MOCK_CONTRACTS: Contract[] = [
    {
        id: '1',
        name: 'BTR Token',
        address: '0xContract...a1b2c3',
        balance: 1000000,
        methods: ['totalSupply()', 'balanceOf(address)', 'transfer(address, uint256)'],
    },
    {
        id: '2',
        name: 'Staking Pool',
        address: '0xContract...d4e5f6',
        balance: 500000,
        methods: ['stake()', 'unstake(uint256)', 'getReward()'],
    },
    {
        id: '3',
        name: 'Voting Contract',
        address: '0xContract...g7h8i9',
        balance: 0,
        methods: ['vote(proposalId, bool)', 'getProposal(proposalId)'],
    },
];

let interactionCounter = 1;

export const useSmartContracts = () => {
    const [contracts, setContracts] = useState<Contract[]>(MOCK_CONTRACTS);
    const [interactions, setInteractions] = useState<ContractInteraction[]>([]);

    const callMethod = useCallback((contractId: string, method: string, params: any[]) => {
        const contract = contracts.find(c => c.id === contractId);
        if (!contract) return;

        // Simulate a result
        let result: any;
        if (method.includes('balanceOf')) {
            result = { balance: Math.floor(Math.random() * 1000) };
        } else if (method.includes('totalSupply')) {
            result = { supply: contract.balance };
        } else {
            result = { success: true, transactionHash: `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` };
        }

        const newInteraction: ContractInteraction = {
            id: interactionCounter++,
            contractId,
            method,
            params,
            result,
            timestamp: new Date().toLocaleString(),
        };

        setInteractions(prev => [newInteraction, ...prev.slice(0, 9)]);
    }, [contracts]);
    
    return { contracts, interactions, callMethod };
};
