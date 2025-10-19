// core/node/src/types.ts

// --- State Management ---

export interface Account {
  address: string;
  balance: number;
  nonce: number;
}

// --- Base Transaction and Block Structures ---

export enum TransactionType {
  TRANSFER = 'TRANSFER',
  CONTRACT_CREATION = 'CONTRACT_CREATION',
  CONTRACT_CALL = 'CONTRACT_CALL',
  STAKE = 'STAKE',
  GOVERNANCE_PROPOSAL = 'GOVERNANCE_PROPOSAL',
  GOVERNANCE_VOTE = 'GOVERNANCE_VOTE',
}

interface BaseTransaction {
  id: string;
  from: string;
  nonce: number; // Transaction count for sender, prevents replay attacks
  signature: string;
  type: TransactionType;
  fee: number;
}

export interface TransferTransaction extends BaseTransaction {
  type: TransactionType.TRANSFER;
  to: string;
  amount: number;
}

export interface ContractCreationTransaction extends BaseTransaction {
  type: TransactionType.CONTRACT_CREATION;
  code: string; // Base64 encoded WASM code
  initialState?: Record<string, any>;
}

export interface ContractCallTransaction extends BaseTransaction {
  type: TransactionType.CONTRACT_CALL;
  contractId: string;
  function: string;
  args: any[];
}

export interface StakeTransaction extends BaseTransaction {
    type: TransactionType.STAKE;
    validator: string; // The public key of the validator being staked for/by
    amount: number;
}

export interface GovernanceProposalTransaction extends BaseTransaction {
  type: TransactionType.GOVERNANCE_PROPOSAL;
  title: string;
  description: string;
  endBlock: number; // Block height at which voting for this proposal ends
}

export interface GovernanceVoteTransaction extends BaseTransaction {
  type: TransactionType.GOVERNANCE_VOTE;
  proposalId: string;
  vote: 'yes' | 'no' | 'abstain';
}

// A union type for all possible transactions
export type Transaction = 
  | TransferTransaction
  | ContractCreationTransaction
  | ContractCallTransaction
  | StakeTransaction
  | GovernanceProposalTransaction
  | GovernanceVoteTransaction;


export interface Block {
  height: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  validator: string;
  signature: string;
  totalFees: number;
}

// --- Governance Module Structures ---

export enum ProposalStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  EXECUTED = 'EXECUTED',
}

export interface Proposal {
    id: string;
    proposer: string;
    title: string;
    description: string;
    startBlock: number;
    endBlock: number;
    status: ProposalStatus;
    votes: {
        yes: number;
        no: number;
        abstain: number;
    };
}

export interface Vote {
    proposalId: string;
    voter: string;
    option: 'yes' | 'no' | 'abstain';
}