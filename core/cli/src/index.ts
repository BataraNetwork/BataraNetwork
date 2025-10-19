import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { BataraClient } from '../../../sdk/js/src/index';
// The SDK also exports the Transaction interface. We use a type-only import
// as we only need it for type definitions.
import type { Transaction } from '../../../sdk/js/src/index';
import * as crypto from './crypto';
// FIX: Import 'process' to provide types for 'process.argv'.
import process from 'process';

const program = new Command();
// Allow configuring the node URL via an environment variable.
const client = new BataraClient(process.env.NODE_API_URL || 'http://localhost:3000');

program
  .name('batara-cli')
  .description('CLI for interacting with the Bataranetwork blockchain')
  .version('0.1.0');

// Command: generate-wallet
program
  .command('generate-wallet')
  .description('Generate a new wallet (key pair) and save it to a file')
  .option('-o, --output <path>', 'Path to save the wallet file', './wallet.json')
  .action((options) => {
    try {
      const { publicKey, privateKey } = crypto.generateKeys();
      const wallet = {
        publicKey,
        privateKey,
      };
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, JSON.stringify(wallet, null, 2));
      console.log(`Wallet generated and saved to ${outputPath}`);
      console.log('\nPublic Key (PEM):');
      console.log(publicKey);
    } catch (error: any) {
      console.error('Failed to generate wallet:', error.message);
    }
  });

// Command: get-status
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

// Command: get-block
program
  .command('get-block <height>')
  .description('Get a block by its height')
  .action(async (heightStr) => {
    const height = parseInt(heightStr, 10);
    if (isNaN(height)) {
      console.error('Error: Block height must be a number.');
      return;
    }
    try {
      const block = await client.getBlock(height);
      console.log(`Block #${height}:`, JSON.stringify(block, null, 2));
    } catch (error: any) {
      console.error(`Error getting block #${height}:`, error.message);
    }
  });

// Command: send-transaction
program
  .command('send-transaction')
  .description('Create and broadcast a new transaction')
  .option('-w, --wallet <path>', 'Path to the sender wallet file')
  .requiredOption('-t, --to <address>', "Recipient's public key (PEM format)")
  .requiredOption('-a, --amount <number>', 'Amount to send')
  .option('-f, --fee <number>', 'Transaction fee', '0')
  .action(async (options) => {
    try {
      let walletPath = options.wallet;

      // If the wallet path is not provided via flags, prompt the user for it.
      // This improves security by preventing the key path from being saved in shell history.
      if (!walletPath) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        const question = (query: string): Promise<string> => new Promise(resolve => rl.question(query, resolve));
        walletPath = await question('Enter the path to your wallet file: ');
        rl.close();
      }

      if (!walletPath) {
        console.error('Error: Wallet file path is required.');
        return;
      }

      const resolvedPath = path.resolve(walletPath);

      // Validate that the file exists and is readable before proceeding.
      try {
        fs.accessSync(resolvedPath, fs.constants.R_OK);
      } catch (err) {
        console.error(`Error: Cannot read wallet file at ${resolvedPath}. Please check the path and permissions.`);
        return;
      }

      const wallet = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
      const { privateKey, publicKey: fromAddress } = wallet;

      // Validate the private key to ensure it's in the correct PEM format.
      if (!privateKey || !crypto.isValidPrivateKey(privateKey)) {
        console.error('Error: Wallet file contains an invalid or missing PEM-encoded private key.');
        return;
      }
      
      if (!fromAddress) {
        console.error('Error: Invalid wallet file format. Must contain publicKey.');
        return;
      }

      const amount = parseFloat(options.amount);
      const fee = parseFloat(options.fee);

      if (isNaN(amount) || amount <= 0) {
        console.error('Error: Amount must be a positive number.');
        return;
      }
      if (isNaN(fee) || fee < 0) {
        console.error('Error: Fee must be a non-negative number.');
        return;
      }

      // To create a deterministic ID, we hash the core transaction data.
      // A timestamp is included to ensure uniqueness for identical transactions.
      const txDataToHash = {
        from: fromAddress,
        to: options.to,
        amount,
        fee,
        timestamp: Date.now(),
      };

      const txId = crypto.hash(txDataToHash);
      const signature = crypto.sign(txId, privateKey);
      
      const transaction: Transaction = {
        id: txId,
        from: fromAddress,
        to: options.to,
        amount,
        fee,
        signature,
      };

      console.log('Broadcasting transaction:', JSON.stringify(transaction, null, 2));
      const result = await client.broadcastTransaction(transaction);
      console.log('Transaction broadcast result:', result);

    } catch (error: any) {
      // Provide more specific feedback for network errors.
      if (error.response) {
        console.error(`Error sending transaction (server response ${error.response.status}):`, error.response.data);
      } else if (error.request) {
        console.error('Error sending transaction: No response from server. Is the node running at the configured URL?');
      } else {
        console.error('Error sending transaction:', error.message);
      }
    }
  });

program.parse(process.argv);