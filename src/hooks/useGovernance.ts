import { useState, useCallback } from 'react';
import { Proposal, Vote } from '../types';

const MOCK_PROPOSALS: Proposal[] = [
    {
        id: 'BIP-42',
        title: 'Increase Block Size to 2MB',
        proposer: '0xDev...a1b2c3',
        status: 'active',
        description: 'This proposal aims to increase the maximum block size from 1MB to 2MB to improve transaction throughput.',
        votes: { yes: 12500000, no: 345000, abstain: 1200000 },
        endBlock: 123456,
    },
    {
        id: 'BIP-41',
        title: 'Community Fund Grant for Tooling',
        proposer: '0xDAO...d4e5f6',
        status: 'passed',
        description: 'Allocate 50,000 BTR from the community fund to a team building a new block explorer.',
        votes: { yes: 25000000, no: 120000, abstain: 500000 },
        endBlock: 110000,
    },
    {
        id: 'BIP-40',
        title: 'Reduce Validator Commission Rate',
        proposer: '0xUser...g7h8i9',
        status: 'failed',
        description: 'This proposal suggests capping the maximum validator commission rate at 5%.',
        votes: { yes: 8000000, no: 15000000, abstain: 2000000 },
        endBlock: 105000,
    },
];

export const useGovernance = () => {
    const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
    const [userVotes, setUserVotes] = useState<Record<string, Vote['option']>>({});

    const castVote = useCallback((proposalId: string, option: Vote['option']) => {
        if (userVotes[proposalId]) return; // Already voted

        setProposals(prev => prev.map(p => {
            if (p.id === proposalId) {
                const newVotes = { ...p.votes, [option]: p.votes[option] + 1000 }; // Simulate 1000 vote power
                return { ...p, votes: newVotes };
            }
            return p;
        }));

        setUserVotes(prev => ({ ...prev, [proposalId]: option }));
    }, [userVotes]);

    return { proposals, userVotes, castVote };
};
