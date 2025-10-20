import { useState, useEffect, useCallback } from 'react';
import { Proposal, Vote } from '../types';
import { nodeService } from '../services/nodeService';
import { useAuth } from './useAuth';
import { hash, sign } from '../utils/crypto';

// Re-defining for frontend usage
enum TransactionType {
  GOVERNANCE_PROPOSAL = 'GOVERNANCE_PROPOSAL',
  GOVERNANCE_VOTE = 'GOVERNANCE_VOTE',
}

export const useGovernance = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, Vote['option']>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useAuth();

    const fetchProposals = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await nodeService.getProposals();
            setProposals(data);
        } catch (error) {
            console.error("Failed to fetch proposals:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProposals();
        const interval = setInterval(fetchProposals, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [fetchProposals]);

    const castVote = useCallback(async (proposalId: string, option: Vote['option']) => {
        const account = await nodeService.getAccount(currentUser.publicKey);
        const txData = {
            from: currentUser.publicKey,
            proposalId,
            vote: option,
            nonce: account.nonce,
            fee: 1,
            type: TransactionType.GOVERNANCE_VOTE,
        };
        const txId = hash(txData);
        const signature = sign(txId, currentUser.privateKey);

        const transaction = {
            ...txData,
            id: txId,
            signature,
        };

        try {
            await nodeService.broadcastTransaction(transaction);
            setUserVotes(prev => ({ ...prev, [proposalId]: option }));
        } catch (error) {
            console.error("Failed to cast vote:", error);
        }
    }, [currentUser]);

    const submitProposal = useCallback(async (proposalData: { title: string, description: string, endBlock: number, proposer: string }) => {
        const account = await nodeService.getAccount(proposalData.proposer);
        const txData = {
            from: proposalData.proposer,
            title: proposalData.title,
            description: proposalData.description,
            endBlock: proposalData.endBlock,
            nonce: account.nonce,
            fee: 10, // Higher fee for proposals
            type: TransactionType.GOVERNANCE_PROPOSAL,
        };
        const txId = hash(txData);
        const signature = sign(txId, currentUser.privateKey);

        const transaction = {
            ...txData,
            id: txId,
            signature,
        };
        
        try {
            await nodeService.broadcastTransaction(transaction);
            // After successful broadcast, create a mock proposal to show in UI immediately
            const newProposal: Proposal = {
                id: txId,
                proposer: proposalData.proposer,
                title: proposalData.title,
                description: proposalData.description,
                status: 'PENDING', // Will become active in the next block
                endBlock: proposalData.endBlock,
                votes: { yes: 0, no: 0, abstain: 0 },
                startBlock: 0, // Placeholder
            };
            setProposals(prev => [newProposal, ...prev]);
            return newProposal;
        } catch (error) {
            console.error("Failed to submit proposal:", error);
            return null;
        }
    }, [currentUser]);

    return { proposals, userVotes, castVote, submitProposal, isLoading };
};
