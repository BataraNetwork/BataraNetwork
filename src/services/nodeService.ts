// src/services/nodeService.ts
import axios from 'axios';
import { LiveNodeStatus } from '../types';

const API_URL = 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getStatus = async (): Promise<LiveNodeStatus> => {
  const response = await apiClient.get('/status');
  return response.data;
};

const getAccount = async (address: string) => {
    const response = await apiClient.get(`/account/${address}`);
    return response.data;
};

const broadcastTransaction = async (tx: any) => {
    const response = await apiClient.post('/transaction', tx);
    return response.data;
};

// For staking
const getValidators = async () => {
    const response = await apiClient.get('/staking/validators');
    return response.data;
};

// For governance
const getProposals = async () => {
    const response = await apiClient.get('/governance/proposals');
    return response.data;
};

// For contracts
const getContracts = async () => {
    const response = await apiClient.get('/contracts');
    return response.data;
};

export const nodeService = {
  getStatus,
  getAccount,
  broadcastTransaction,
  getValidators,
  getProposals,
  getContracts,
};
