
import axios, { AxiosInstance } from 'axios';

// Define the transaction structure for the SDK
export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  signature: string; // Signature of the transaction hash
}

export class BataraClient {
    private rpc: AxiosInstance;

    constructor(nodeUrl: string = 'http://localhost:3000') {
        this.rpc = axios.create({
            baseURL: nodeUrl,
            headers: { 'Content-Type': 'application/json' },
        });
    }

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

    public async broadcastTransaction(tx: Transaction): Promise<any> {
        try {
            const response = await this.rpc.post('/transaction', tx);
            return response.data;
        } catch (error) {
            console.error('Failed to broadcast transaction:', error);
            throw error;
        }
    }
}