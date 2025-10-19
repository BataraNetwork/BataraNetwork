import { useState, useCallback, useEffect } from 'react';

export enum ProposalStatus {
  ACTIVE = 'active',
  PASSED = 'passed',
  FAILED = 'failed',
  EXECUTED = 'executed',
}

export interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  endBlock: number;
  votes: {
    yes: number;
    no: number;
    abstain: number;
  };
}

const MOCK_PROPOSALS: Proposal[] = [
    {
      id: 1,
      title: 'Protocol Upgrade v1.2',
      description: 'This proposal includes optimizations to the state transition logic and reduces gas costs for common operations.',
      proposer: '0xValidator...1a2b3c',
      status: ProposalStatus.PASSED,
      endBlock: 850,
      votes: { yes: 1258, no: 112, abstain: 50 },
    },
    {
      id: 2,
      title: 'Increase Validator Set Size',
      description: 'Increase the maximum number of active validators from 100 to 125 to improve decentralization.',
      proposer: '0xCommunity...4d5e6f',
      status: ProposalStatus.ACTIVE,
      endBlock: 1250,
      votes: { yes: 450, no: 210, abstain: 80 },
    },
    {
      id: 3,
      title: 'Community Grant for Dev Tooling',
      description: 'Allocate 50,000 BTR tokens from the treasury to fund the development of a new Javascript SDK.',
      proposer: '0xDevFund...7g8h9i',
      status: ProposalStatus.FAILED,
      endBlock: 900,
      votes: { yes: 305, no: 450, abstain: 25 },
    },
     {
      id: 4,
      title: 'Implement On-Chain Treasury',
      description: 'Create a decentralized treasury managed by governance to fund ecosystem projects.',
      proposer: '0xCoreTeam...jKlM0p',
      status: ProposalStatus.EXECUTED,
      endBlock: 500,
      votes: { yes: 2500, no: 50, abstain: 10 },
    }
];

let nextProposalId = MOCK_PROPOSALS.length + 1;

export const useGovernance = (latestBlockHeight: number) => {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [hasVoted, setHasVoted] = useState<Set<number>>(new Set());

  const submitProposal = useCallback((title: string, description: string) => {
    const newProposal: Proposal = {
      id: nextProposalId++,
      title,
      description,
      proposer: '0xYourAddress...aBcDeF',
      status: ProposalStatus.ACTIVE,
      endBlock: latestBlockHeight + 100, // Ends in 100 blocks
      votes: { yes: 1, no: 0, abstain: 0 }, // Start with proposer's own vote
    };
    setProposals(prev => [newProposal, ...prev]);
  }, [latestBlockHeight]);

  const castVote = useCallback((proposalId: number, vote: 'yes' | 'no' | 'abstain') => {
    if (hasVoted.has(proposalId)) return; // Prevent re-voting

    setProposals(prev => prev.map(p => {
      if (p.id === proposalId && p.status === 'active') {
        // Simulate other community votes happening at the same time for realism
        const otherYes = Math.floor(Math.random() * 50);
        const otherNo = Math.floor(Math.random() * 30);
        return {
          ...p,
          votes: {
            yes: p.votes.yes + (vote === 'yes' ? 1 : 0) + otherYes,
            no: p.votes.no + (vote === 'no' ? 1 : 0) + otherNo,
            abstain: p.votes.abstain + (vote === 'abstain' ? 1 : 0),
          },
        };
      }
      return p;
    }));
    setHasVoted(prev => new Set(prev).add(proposalId));
  }, [hasVoted]);

  // Effect to update proposal status based on block height
  useEffect(() => {
    if(latestBlockHeight === 0) return; // Don't run on initial zero state

    const timer = setTimeout(() => {
        setProposals(prev => prev.map(p => {
            if (p.status === ProposalStatus.ACTIVE && latestBlockHeight > p.endBlock) {
                return {
                ...p,
                status: p.votes.yes > p.votes.no ? ProposalStatus.PASSED : ProposalStatus.FAILED,
                };
            }
            return p;
        }));
    }, 1000); // Add a small delay to simulate processing

    return () => clearTimeout(timer);

  }, [latestBlockHeight]);

  return { proposals, submitProposal, castVote, hasVoted };
};
