// sdk/js/src/index.ts

import axios, { AxiosInstance } from 'axios';

// --- Type Definitions ---
// Re-exporting types from the core package for SDK users.

export interface Account {
  address: string;
  balance: number;
  nonce: number;
}

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
  nonce: number;
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
  code: string;
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
    validator: string;
    amount: number;
}

export interface GovernanceProposalTransaction extends BaseTransaction {
  type: TransactionType.GOVERNANCE_PROPOSAL;
  title: string;
  description: string;
  endBlock: number;
}

export interface GovernanceVoteTransaction extends BaseTransaction {
  type: TransactionType.GOVERNANCE_VOTE;
  proposalId: string;
  vote: 'yes' | 'no' | 'abstain';
}

export type Transaction = 
  | TransferTransaction
  | ContractCreationTransaction
  | ContractCallTransaction
  | StakeTransaction
  | GovernanceProposalTransaction
  | GovernanceVoteTransaction;


// --- BataraClient Class ---

export class BataraClient {
    private rpc: AxiosInstance;

    constructor(nodeUrl: string = 'http://localhost:3000') {
        this.rpc = axios.create({
            baseURL: nodeUrl,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // --- Core Methods ---

    public async getStatus(): Promise<any> {
        try {
            const response = await this.rpc.get('/status');
            return response.data;
        } catch (error) {
            console.error('Failed to get node status:', error);
            throw error;
        }
    }

    public async getBlock(height: number): Promise<any> {
        try {
            const response = await this.rpc.get(`/block/${height}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get block #${height}:`, error);
            throw error;
        }
    }
    
    /**
     * Broadcasts any valid transaction to the mempool.
     * @param tx The transaction object.
     */
    public async broadcastTransaction(tx: Transaction): Promise<any> {
        try {
            const response = await this.rpc.post('/transaction', tx);
            return response.data;
        } catch (error) {
            console.error('Failed to broadcast transaction:', error);
            throw error;
        }
    }

    // --- High-Level Transaction Methods ---
    
    /**
     * Broadcasts a signed token transfer transaction.
     * @param tx The signed TransferTransaction object.
     */
    public async transferTokens(tx: TransferTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }

    /**
     * Broadcasts a signed contract deployment transaction.
     * @param tx The signed ContractCreationTransaction object.
     */
    public async deployContract(tx: ContractCreationTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }

    /**
     * Broadcasts a signed contract call transaction.
     * @param tx The signed ContractCallTransaction object.
     */
    public async callContract(tx: ContractCallTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }
    
    /**
     * Broadcasts a signed staking transaction.
     * @param tx The signed StakeTransaction object.
     */
    public async stakeTokens(tx: StakeTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }

    /**
     * Broadcasts a signed governance proposal transaction.
     * @param tx The signed GovernanceProposalTransaction object.
     */
    public async submitGovernanceProposal(tx: GovernanceProposalTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }

    /**
     * Broadcasts a signed governance vote transaction.
     * @param tx The signed GovernanceVoteTransaction object.
     */
    public async castGovernanceVote(tx: GovernanceVoteTransaction): Promise<any> {
        return this.broadcastTransaction(tx);
    }
    
    // --- State Methods ---

    public async getAccount(address: string): Promise<Account> {
        try {
            const response = await this.rpc.get(`/account/${address}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to get account ${address}:`, error);
            throw error;
        }
    }

    // --- Staking Methods ---

    public async getValidators(): Promise<any> {
        try {
            const response = await this.rpc.get('/staking/validators');
            return response.data;
        } catch (error) {
            console.error('Failed to get validators:', error);
            throw error;
        }
    }

    // --- Governance Methods ---

    public async getProposals(): Promise<any> {
        try {
            const response = await this.rpc.get('/governance/proposals');
            return response.data;
        } catch (error) {
            console.error('Failed to get proposals:', error);
            throw error;
        }
    }
}