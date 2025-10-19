// core/cli/src/index.ts

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
// FIX: Changed to a standard import to use TransactionType enum as a value, and used `type` keyword for type-only imports.
import { BataraClient, TransactionType, type Transaction, type TransferTransaction, type StakeTransaction, type ContractCreationTransaction, type GovernanceProposalTransaction, type GovernanceVoteTransaction, type ContractCallTransaction } from '../../../sdk/js/src/index';
import * as crypto from './crypto';
import process from 'process';

const program = new Command();
const client = new BataraClient(process.env.NODE_API_URL || 'http://localhost:3000');

program
  .name('batara-cli')
  .description('CLI for interacting with the Bataranetwork blockchain')
  .version('0.1.0');

// Helper to create and sign a transaction
const createSignedTransaction = (walletPath: string, txData: { type: TransactionType; fee: number; nonce: number } & { [key: string]: any }): Transaction => {
    const resolvedPath = path.resolve(walletPath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Wallet file not found at ${resolvedPath}`);
    }
    const wallet = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    const { privateKey, publicKey: fromAddress } = wallet;

    if (!privateKey || !crypto.isValidPrivateKey(privateKey)) {
        throw new Error('Wallet file contains an invalid or missing private key.');
    }
    
    // Nonce is now part of the signed payload
    const txToHash = { ...txData, from: fromAddress, timestamp: Date.now() };
    const txId = crypto.hash(txToHash);
    const signature = crypto.sign(txId, privateKey);

    return {
        ...txData,
        id: txId,
        from: fromAddress,
        signature,
    } as Transaction;
};


// --- Wallet Commands ---
program
  .command('generate-wallet')
  .description('Generate a new wallet (key pair) and save it to a file')
  .option('-o, --output <path>', 'Path to save the wallet file', './wallet.json')
  .action((options) => {
    try {
      const { publicKey, privateKey } = crypto.generateKeys();
      const wallet = { publicKey, privateKey };
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, JSON.stringify(wallet, null, 2));
      console.log(`Wallet generated and saved to ${outputPath}`);
      console.log(`\nPublic Key (Address):\n${publicKey}`);
    } catch (error: any) {
      console.error('Failed to generate wallet:', error.message);
    }
  });

// --- Node Info Commands ---
program
  .command('get-status')
  .description('Get the current status of the blockchain node')
  .action(async () => {
    try {
      const status = await client.getStatus();
      console.log('Node Status:', JSON.stringify(status, null, 2));
    } catch (error: any) {
      console.error('Error getting status:', error.message);
    }
  });

program
  .command('get-block <height>')
  .description('Get a block by its height')
  .action(async (heightStr) => {
    const height = parseInt(heightStr, 10);
    if (isNaN(height)) return console.error('Error: Block height must be a number.');
    try {
      const block = await client.getBlock(height);
      console.log(`Block #${height}:`, JSON.stringify(block, null, 2));
    } catch (error: any) {
      console.error(`Error getting block #${height}:`, error.message);
    }
  });

program
    .command('get-balance <address>')
    .description("Get an account's balance and nonce")
    .action(async (address) => {
        try {
            const account = await client.getAccount(address);
            console.log(`Account details for ${address}:`, JSON.stringify(account, null, 2));
        } catch (error: any) {
            console.error(`Error getting balance:`, error.message);
        }
    });

// --- Transaction Commands ---
program
  .command('send-transfer')
  .description('Create and broadcast a transfer transaction')
  .requiredOption('-w, --wallet <path>', 'Path to the sender wallet file')
  .requiredOption('-t, --to <address>', "Recipient's public key (PEM format)")
  .requiredOption('-a, --amount <number>', 'Amount to send')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
    try {
      const transaction = createSignedTransaction(options.wallet, {
        type: TransactionType.TRANSFER,
        to: options.to,
        amount: parseFloat(options.amount),
        nonce: parseInt(options.nonce, 10),
        fee: parseFloat(options.fee),
      });
      console.log('Broadcasting transfer:', JSON.stringify(transaction, null, 2));
      const result = await client.transferTokens(transaction as TransferTransaction);
      console.log('Broadcast result:', result);
    } catch (error: any) {
      console.error('Error sending transaction:', error.message);
    }
  });

// --- Staking Commands ---
program
  .command('stake-tokens')
  .description('Stake tokens for a validator')
  .requiredOption('-w, --wallet <path>', 'Path to the staker wallet file')
  .requiredOption('-v, --validator <address>', 'The public key of the validator to stake for')
  .requiredOption('-a, --amount <number>', 'Amount to stake')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
    try {
        const transaction = createSignedTransaction(options.wallet, {
            type: TransactionType.STAKE,
            validator: options.validator,
            amount: parseFloat(options.amount),
            nonce: parseInt(options.nonce, 10),
            fee: parseFloat(options.fee),
        });
        console.log('Broadcasting stake transaction:', JSON.stringify(transaction, null, 2));
        const result = await client.stakeTokens(transaction as StakeTransaction);
        console.log('Broadcast result:', result);
    } catch (error: any) {
        console.error('Error staking tokens:', error.message);
    }
  });

// --- Smart Contract Commands ---
program
  .command('deploy-contract')
  .description('Deploy a WASM smart contract with optional initial state')
  .requiredOption('-w, --wallet <path>', 'Path to the deployer wallet file')
  .requiredOption('-c, --code <path>', 'Path to the WASM file')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-i, --init-state <json_string>', 'Optional initial state for the contract as a JSON string')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
      try {
        const code = fs.readFileSync(path.resolve(options.code), 'base64');
        
        let initialState: Record<string, any> | undefined = undefined;
        if (options.initState) {
            try {
                initialState = JSON.parse(options.initState);
            } catch (e: any) {
                throw new Error(`Invalid JSON for initial state: ${e.message}`);
            }
        }
        
        const txPayload: any = {
            type: TransactionType.CONTRACT_CREATION,
            code,
            nonce: parseInt(options.nonce, 10),
            fee: parseFloat(options.fee),
        };

        if (initialState) {
            txPayload.initialState = initialState;
        }

        const transaction = createSignedTransaction(options.wallet, txPayload);
        
        console.log('Broadcasting contract deployment:', JSON.stringify(transaction, null, 2));
        
        const result = await client.deployContract(transaction as ContractCreationTransaction);
        console.log('Broadcast result:', result);
        console.log(`\nContract deployment transaction sent. Its ID is ${transaction.id}`);

      } catch (error: any) {
          console.error('Error deploying contract:', error.message);
      }
  });

program
  .command('call-contract')
  .description('Call a function on a deployed smart contract')
  .requiredOption('-w, --wallet <path>', 'Path to the caller wallet file')
  .requiredOption('-cid, --contract-id <id>', 'The ID of the contract to call')
  .requiredOption('--function <name>', 'The name of the function to call')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-a, --args <json_array>', 'Arguments for the function as a JSON array string', '[]')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
    try {
        let args: any[] = [];
        try {
            args = JSON.parse(options.args);
            if (!Array.isArray(args)) throw new Error();
        } catch (e) {
            throw new Error(`Invalid JSON for arguments. Please provide a valid JSON array string, e.g., '["hello", 42]'.`);
        }
        
        const transaction = createSignedTransaction(options.wallet, {
            type: TransactionType.CONTRACT_CALL,
            contractId: options.contractId,
            function: options.function,
            args,
            nonce: parseInt(options.nonce, 10),
            fee: parseFloat(options.fee),
        });

        console.log('Broadcasting contract call:', JSON.stringify(transaction, null, 2));

        const result = await client.callContract(transaction as ContractCallTransaction);
        console.log('Broadcast result:', result);
        console.log(`\nContract call transaction sent. Its ID is ${transaction.id}`);

    } catch (error: any) {
        console.error('Error calling contract:', error.message);
    }
  });

// --- Governance Commands ---
program
  .command('submit-proposal')
  .description('Submit a new governance proposal')
  .requiredOption('-w, --wallet <path>', 'Path to the proposer wallet file')
  .requiredOption('--title <title>', 'Title of the proposal')
  .requiredOption('--description <desc>', 'Description of the proposal')
  .requiredOption('--end-block <height>', 'Block height for voting to end')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
      try {
        const transaction = createSignedTransaction(options.wallet, {
            type: TransactionType.GOVERNANCE_PROPOSAL,
            title: options.title,
            description: options.description,
            endBlock: parseInt(options.endBlock, 10),
            nonce: parseInt(options.nonce, 10),
            fee: parseFloat(options.fee),
        });
        console.log('Submitting proposal...');
        const result = await client.submitGovernanceProposal(transaction as GovernanceProposalTransaction);
        console.log('Broadcast result:', result);
      } catch (error: any) {
          console.error('Error submitting proposal:', error.message);
      }
  });

program
  .command('cast-vote')
  .description('Cast a vote on a governance proposal')
  .requiredOption('-w, --wallet <path>', 'Path to the voter wallet file')
  .requiredOption('-p, --proposal-id <id>', 'ID of the proposal to vote on')
  .requiredOption('-v, --vote <option>', 'The vote option: "yes", "no", or "abstain"')
  .requiredOption('-n, --nonce <number>', 'The next nonce for the sender account')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
      try {
        const voteOption = options.vote.toLowerCase();
        if (!['yes', 'no', 'abstain'].includes(voteOption)) {
            throw new Error('Invalid vote option. Must be one of "yes", "no", or "abstain".');
        }
        const transaction = createSignedTransaction(options.wallet, {
            type: TransactionType.GOVERNANCE_VOTE,
            proposalId: options.proposalId,
            vote: voteOption,
            nonce: parseInt(options.nonce, 10),
            fee: parseFloat(options.fee),
        });
        console.log('Casting vote...');
        const result = await client.castGovernanceVote(transaction as GovernanceVoteTransaction);
        console.log('Broadcast result:', result);
      } catch (error: any) {
          console.error('Error casting vote:', error.message);
      }
  });


program.parse(process.argv);
