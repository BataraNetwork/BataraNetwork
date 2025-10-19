// core/node/src/governance/governanceModule.ts

import { GovernanceProposalTransaction, GovernanceVoteTransaction, Proposal, ProposalStatus, Vote } from '../types';
import crypto from 'crypto';

/**
 * Manages the on-chain governance process.
 * 
 * This module simulates the lifecycle of proposals, including submission, voting,
 * and tallying. In a real system, this state would be part of the blockchain's
 * persistent state.
 */
export class GovernanceModule {
  private proposals: Map<string, Proposal> = new Map();
  private votes: Map<string, Vote[]> = new Map(); // proposalId -> votes

  constructor() {
    console.log('On-chain Governance Module initialized.');
  }

  /**
   * Submits a new governance proposal.
   * @param tx The proposal transaction.
   * @param currentBlockHeight The current block height, used to set the start block.
   */
  public submitProposal(tx: GovernanceProposalTransaction, currentBlockHeight: number): string {
    // FIX: Use `tx.from` which contains the proposer's address, instead of the non-existent `tx.proposer`.
    const proposalId = crypto.createHash('sha256').update(tx.from + tx.title + Date.now()).digest('hex');
    
    const newProposal: Proposal = {
      id: proposalId,
      proposer: tx.from,
      title: tx.title,
      description: tx.description,
      startBlock: currentBlockHeight,
      endBlock: tx.endBlock,
      status: ProposalStatus.ACTIVE,
      votes: {
        yes: 0,
        no: 0,
        abstain: 0,
      },
    };

    this.proposals.set(proposalId, newProposal);
    this.votes.set(proposalId, []);
    
    console.log(`New governance proposal submitted: "${tx.title}" (ID: ${proposalId})`);
    return proposalId;
  }

  /**
   * Casts a vote on an active proposal.
   * @param tx The vote transaction.
   */
  public castVote(tx: GovernanceVoteTransaction): boolean {
    const proposal = this.proposals.get(tx.proposalId);
    if (!proposal || proposal.status !== ProposalStatus.ACTIVE) {
      console.warn(`Attempted to vote on an invalid or inactive proposal: ${tx.proposalId}`);
      return false;
    }

    const proposalVotes = this.votes.get(tx.proposalId);
    if (!proposalVotes) return false;

    // Check if voter has already voted
    if (proposalVotes.some(v => v.voter === tx.from)) {
        console.warn(`Address ${tx.from} has already voted on proposal ${tx.proposalId}.`);
        return false;
    }
    
    // In a real system, voting power would be based on token holdings at a snapshot block.
    // Here, we'll simulate 1 address = 1 vote.
    proposal.votes[tx.vote]++;
    proposalVotes.push({
        proposalId: tx.proposalId,
        voter: tx.from,
        option: tx.vote,
    });
    
    console.log(`Vote cast by ${tx.from} on proposal ${tx.proposalId}: ${tx.vote}`);
    return true;
  }

  /**
   * Tallies the votes for proposals that have concluded.
   * This should be called at the beginning of each new block.
   * @param currentBlockHeight The current block height.
   */
  public tallyVotes(currentBlockHeight: number): void {
    for (const proposal of this.proposals.values()) {
      if (proposal.status === ProposalStatus.ACTIVE && currentBlockHeight > proposal.endBlock) {
        console.log(`Tallying votes for proposal: "${proposal.title}"`);
        if (proposal.votes.yes > proposal.votes.no) {
          proposal.status = ProposalStatus.PASSED;
          console.log(` -> Proposal PASSED`);
          // In a real system, the passed proposal would be queued for execution.
        } else {
          proposal.status = ProposalStatus.FAILED;
          console.log(` -> Proposal FAILED`);
        }
      }
    }
  }

  /**
   * Retrieves all governance proposals.
   */
  public getProposals(): Proposal[] {
    return Array.from(this.proposals.values());
  }
}