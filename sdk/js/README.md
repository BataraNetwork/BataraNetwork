# Bataranetwork JavaScript/TypeScript SDK

This is the official JavaScript/TypeScript SDK for interacting with a Bataranetwork blockchain node. It provides a simple and convenient way to query the blockchain, create transactions, and broadcast them to the network.

This SDK is an isomorphic library, meaning it can run in both Node.js environments and modern web browsers.

## Features

-   Query node status, blocks, accounts, and more.
-   High-level methods for broadcasting all transaction types:
    -   Token Transfers (BTR)
    -   Smart Contract Deployment & Calls
    -   Staking & Governance
-   Fully typed with TypeScript for a better developer experience.

## Installation

```sh
# Using pnpm (in this monorepo)
pnpm add @bataranetwork/sdk-js

# Using npm
npm install @bataranetwork/sdk-js

# Using yarn
yarn add @bataranetwork/sdk-js
```

## Usage

### 1. Initialize the Client

The `BataraClient` is the main entry point for all interactions with the node.

```typescript
import { BataraClient } from '@bataranetwork/sdk-js';

// Connect to a node running on localhost
const client = new BataraClient('http://localhost:3000');

async function checkStatus() {
  try {
    const status = await client.getStatus();
    console.log(`Node is running. Latest Block Height: ${status.latestBlockHeight}`);
  } catch (error) {
    console.error('Failed to connect to the node:', error);
  }
}

checkStatus();
```

### 2. Querying the Blockchain

You can easily fetch on-chain data like account balances, blocks, and governance proposals.

```typescript
// Get account details
const account = await client.getAccount('---BEGIN PUBLIC KEY---\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...\n---END PUBLIC KEY---');
console.log(`Account Balance: ${account.balance} BTR`);
console.log(`Account Nonce: ${account.nonce}`);

// Get a specific block
const block = await client.getBlock(100);
console.log('Block 100:', block);

// Get the list of active validators
const validators = await client.getValidators();
console.log('Active Validators:', validators);
```

### 3. Broadcasting a Transaction

Broadcasting a transaction is a multi-step process that typically involves:
1.  Creating the transaction data.
2.  Hashing it to get a unique ID.
3.  Signing the hash with your private key.
4.  Broadcasting the complete, signed transaction object.

**Note:** For this example, you would need a crypto utility library that is compatible with the node's `secp256k1` keys. The DevOps dashboard has an internal implementation of this.

```typescript
import { TransactionType, TransferTransaction } from '@bataranetwork/sdk-js';
// Assume `hash` and `sign` functions are available
import { hash, sign } from './your-crypto-utils'; 

async function sendTokens(privateKey: string) {
  const fromAddress = 'your-public-key-pem';
  const toAddress = 'recipient-public-key-pem';
  
  // Get the latest nonce for the sender's account
  const { nonce } = await client.getAccount(fromAddress);

  // 1. Create the transaction data
  const txData = {
    from: fromAddress,
    to: toAddress,
    amount: 100, // Send 100 BTR
    fee: 1,      // Pay a 1 BTR fee
    nonce: nonce,
    type: TransactionType.TRANSFER,
  };

  // 2. Hash the data to get an ID
  const txId = hash(txData);

  // 3. Sign the hash with the private key
  const signature = sign(txId, privateKey);

  // 4. Create the final transaction object and broadcast
  const signedTx: TransferTransaction = {
    id: txId,
    signature,
    ...txData,
  };
  
  try {
    const response = await client.transferTokens(signedTx);
    console.log('Transaction broadcasted successfully!', response);
  } catch (error) {
    console.error('Failed to send transaction:', error);
  }
}
```
