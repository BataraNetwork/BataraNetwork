import axios from 'axios';

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export const search = async (query: string) => {
    const { data } = await apiClient.get(`/search/${query}`);
    return data;
};

export const getStatus = async () => {
  const { data } = await apiClient.get('/status');
  return data;
};

export const getBlocks = async (limit = 20, offset = 0) => {
    const { data } = await apiClient.get(`/blocks?limit=${limit}&offset=${offset}`);
    return data;
};

export const getBlock = async (height: number) => {
  const { data } = await apiClient.get(`/block/${height}`);
  return data;
};

export const getTransactions = async (limit = 20, offset = 0) => {
    const { data } = await apiClient.get(`/transactions?limit=${limit}&offset=${offset}`);
    return data;
};

export const getTransaction = async (id: string) => {
  const { data } = await apiClient.get(`/transaction/${id}`);
  return data;
};

export const getAccount = async (address: string) => {
    const { data } = await apiClient.get(`/account/${encodeURIComponent(address)}`);
    return data;
};
