// FIX: Created missing nodeService.ts file to handle API calls to the backend.
import axios from 'axios';
import { Proposal, Validator, DeployedContract, ContractState } from '../types';

// This URL should point to your running Bataranetwork node's HTTP server.
const NODE_API_URL = process.env.REACT_APP_NODE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: NODE_API_URL,
});

const getStatus = async () => {
  const { data } = await apiClient.get('/status');
  return data;
};

const getProposals = async (): Promise<Proposal[]> => {
    const { data } = await apiClient.get('/governance/proposals');
    return data;
};

const getAccount = async (address: string): Promise<{ address: string, balance: number, nonce: number }> => {
    const { data } = await apiClient.get(`/account/${encodeURIComponent(address)}`);
    return data;
};

const getValidators = async (): Promise<Validator[]> => {
    const { data } = await apiClient.get('/staking/validators');
    // The backend might not have all the fields the frontend expects, so we augment it here.
    // This is a common pattern when frontend/backend models diverge slightly.
    return data.map((v: any) => ({
        ...v,
        name: v.name || `Validator ${v.address.substring(0, 15)}...`,
        commission: v.commission || 5,
        uptime: v.uptime || 99.9,
        status: v.status || 'active'
    }));
};

const broadcastTransaction = async (tx: any): Promise<any> => {
    const { data } = await apiClient.post('/transaction', tx);
    return data;
};

const getDeployedContracts = async (): Promise<DeployedContract[]> => {
    const { data } = await apiClient.get('/contracts');
    return data;
};

const getContractState = async (contractId: string): Promise<ContractState> => {
    const { data } = await apiClient.get(`/contract/${contractId}`);
    return data;
};

export const nodeService = {
  getStatus,
  getProposals,
  getAccount,
  getValidators,
  broadcastTransaction,
  getDeployedContracts,
  getContractState,
};
