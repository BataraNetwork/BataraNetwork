#!/usr/bin/env node

import { Command } from 'commander';
import axios, { AxiosInstance } from 'axios';
import { generateKeys, hash, sign, isValidPrivateKey } from './crypto';
import fs from 'fs';
import path from 'path';
import process from 'process';

// --- Type Definitions and Client ---
// Re-implementing to avoid module resolution issues in this standalone script.

enum TransactionType {
  TRANSFER = 'TRANSFER',
  STAKE = 'STAKE',
}

interface BaseTransaction {
  id: string;
  from: string;
  nonce: number;
  signature: string;
  type: TransactionType;
  fee: number;
}

interface TransferTransaction extends BaseTransaction {
  type: TransactionType.TRANSFER;
  to: string;
  amount: number;
}

type Transaction = TransferTransaction; // Add other types here if needed

class BataraApiClient {
    private rpc: AxiosInstance;

    constructor(nodeUrl: string) {
        this.rpc = axios.create({
            baseURL: nodeUrl,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    public async getStatus(): Promise<any> {
        const response = await this.rpc.get('/status');
        return response.data;
    }

    public async getBlock(height: number): Promise<any> {
        const response = await this.rpc.get(`/block/${height}`);
        return response.data;
    }

    public async getAccount(address: string): Promise<{ address: string, balance: number, nonce: number }> {
        const response = await this.rpc.get(`/account/${address}`);
        return response.data;
    }

    public async broadcastTransaction(tx: Transaction): Promise<any> {
        const response = await this.rpc.post('/transaction', tx);
        return response.data;
    }
}


// --- CLI Logic ---

const program = new Command();
const WALLET_PATH = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.batara-wallet.json');

// --- Wallet Management ---
const loadWallet = () => {
  if (!fs.existsSync(WALLET_PATH)) {
    console.error(`Error: Wallet not found at ${WALLET_PATH}.`);
    console.error('Please create one using `batara-cli wallet create`.');
    process.exit(1);
  }
  const walletData = JSON.parse(fs.readFileSync(WALLET_PATH, 'utf-8'));
  if (!isValidPrivateKey(walletData.privateKey)) {
      console.error('Error: Invalid private key found in wallet file.');
      process.exit(1);
  }
  return walletData as { publicKey: string, privateKey: string };
};

program
  .version('0.1.0')
  .description('Command-line interface for the Bataranetwork blockchain');

program
  .command('status')
  .description('Get the current status of the node')
  .option('-n, --node <url>', 'Node RPC URL', 'http://localhost:3000')
  .action(async (options) => {
    const client = new BataraApiClient(options.node);
    try {
      const status = await client.getStatus();
      console.log(JSON.stringify(status, null, 2));
    } catch (e: any) {
      console.error('Failed to get status:', e.response?.data?.error || e.message);
    }
  });

program
  .command('get-block <height>')
  .description('Get a block by its height')
  .option('-n, --node <url>', 'Node RPC URL', 'http://localhost:3000')
  .action(async (heightStr, options) => {
      const client = new BataraApiClient(options.node);
      const height = parseInt(heightStr, 10);
      if(isNaN(height)) {
          console.error('Error: Block height must be a number.');
          return;
      }
      try {
        const block = await client.getBlock(height);
        console.log(JSON.stringify(block, null, 2));
      } catch (e: any) {
        console.error('Failed to get block:', e.response?.data?.error || e.message);
      }
  });

program
    .command('get-balance <address>')
    .description('Get the BTR balance of an account.')
    .option('-n, --node <url>', 'Node RPC URL', 'http://localhost:3000')
    .action(async (address, options) => {
        const client = new BataraApiClient(options.node);
        try {
            const account = await client.getAccount(address);
            console.log(`Balance for ${address.substring(0, 20)}...: ${account.balance} BTR`);
        } catch (e: any) {
            console.error('Failed to get balance:', e.response?.data?.error || e.message);
        }
    });

program
    .command('transfer <to> <amount>')
    .description('Transfer an amount of BTR to another address.')
    .option('-f, --fee <fee>', 'Transaction fee in BTR', '1')
    .option('-n, --node <url>', 'Node RPC URL', 'http://localhost:3000')
    .action(async (to, amountStr, options) => {
        const client = new BataraApiClient(options.node);
        const { publicKey, privateKey } = loadWallet();
        
        const amount = parseInt(amountStr, 10);
        const fee = parseInt(options.fee, 10);

        if (isNaN(amount) || isNaN(fee) || amount <= 0 || fee < 0) {
            console.error('Error: Amount and fee must be valid, positive numbers.');
            return;
        }
        
        try {
            const fromAccount = await client.getAccount(publicKey);
            const nonce = fromAccount.nonce;

            // FIX: Explicitly create the object to be hashed to avoid type inference issues.
            const txDataToHash = {
                from: publicKey,
                to,
                amount,
                fee,
                nonce,
                type: TransactionType.TRANSFER,
            };
            
            const txId = hash(txDataToHash);
            const signature = sign(txId, privateKey);
            
            // FIX: Construct the final transaction object with the correct type.
            const transaction: TransferTransaction = {
                id: txId,
                from: publicKey,
                to,
                amount,
                fee,
                nonce,
                signature,
                type: TransactionType.TRANSFER,
            };

            console.log('Broadcasting transaction...');
            const result = await client.broadcastTransaction(transaction);
            console.log('Transaction broadcasted successfully:');
            console.log(JSON.stringify(result, null, 2));

        } catch (e: any) {
            console.error('Failed to send transaction:', e.response?.data?.error || e.response?.data?.message || e.message);
        }
    });

const wallet = program.command('wallet').description('Manage your local wallet');

wallet
    .command('create')
    .description('Create a new wallet and save it')
    .action(() => {
        if (fs.existsSync(WALLET_PATH)) {
            console.error(`Wallet already exists at ${WALLET_PATH}.`);
            console.error('Please remove or rename it first to create a new one.');
            return;
        }
        const { publicKey, privateKey } = generateKeys();
        fs.writeFileSync(WALLET_PATH, JSON.stringify({ publicKey, privateKey }, null, 2));
        console.log('Wallet created successfully!');
        console.log(`\nPublic Key (Address):\n${publicKey}`);
        console.log(`\nWallet saved to: ${WALLET_PATH}`);
    });

wallet
    .command('show')
    .description('Show the public key of the current wallet')
    .action(() => {
        const { publicKey } = loadWallet();
        console.log(`Wallet Public Key (Address):\n${publicKey}`);
    });

(async () => {
    await program.parseAsync(process.argv);
})();