import axios from 'axios';

// This URL should point to the explorer's backend, which would then proxy requests to the blockchain node.
// For development, we can point it to a local backend server.
// FIX: Cast `import.meta` to `any` to access the `env` property without TypeScript errors in an environment where Vite client types are not globally declared.
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

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
