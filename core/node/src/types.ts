
export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  fee: number;
  signature: string;
}

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