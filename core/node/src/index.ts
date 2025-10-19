// core/node/src/index.ts
import process from 'process';
import { Blockchain } from './blockchain';
import { PoSConsensus } from './consensus/pos';
import { Mempool } from './mempool';
import { GrpcServer } from './rpc/grpcServer';
import { HttpServer } from './rpc/httpServer';
import { LevelStorage } from './storage/level';
import { Validator } from './validator/validator';
import { P2pService } from './p2p/p2pService';
import { Block } from './types';
import { StakingManager } from './staking/stakingManager';
import { WasmEngine } from './vm/wasmEngine';
import { GovernanceModule } from './governance/governanceModule';
import { StateManager } from './state/stateManager';

const DB_PATH = process.env.DB_PATH || './db';
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50051', 10);
const P2P_PORT = parseInt(process.env.P2P_PORT || '6001', 10);
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '5000', 10); // 5 seconds

async function main() {
  // 1. Initialize Core Components
  const storage = new LevelStorage(DB_PATH);
  await storage.open();
  const mempool = new Mempool();
  const validator = new Validator(); // Represents this node's identity
  
  // 2. Initialize New Architectural Modules
  const wasmEngine = new WasmEngine();
  const governanceModule = new GovernanceModule();
  const stateManager = new StateManager(storage);
  
  // Define genesis accounts and validator stakes
  const genesisAccounts = [
    { address: validator.publicKey, balance: 1_000_000_000 },
  ];
  const genesisValidators = [
    { validator: validator.publicKey, amount: 1000000 },
  ];

  await stateManager.initializeGenesisState(genesisAccounts);

  const stakingManager = new StakingManager(genesisValidators);

  // 3. Initialize Blockchain with all modules
  const blockchain = new Blockchain(storage, mempool, stakingManager, wasmEngine, governanceModule, stateManager);
  await blockchain.initialize();
  
  const p2p = new P2pService(blockchain, mempool);

  // 4. Set up Consensus Mechanism
  const consensus = new PoSConsensus(blockchain, mempool, validator, stakingManager);

  // 5. Start P2P and RPC Servers, passing in all necessary modules for the API
  p2p.listen(P2P_PORT, PEERS);
  new HttpServer(blockchain, mempool, p2p, stakingManager, governanceModule, stateManager, HTTP_PORT);
  new GrpcServer(blockchain, mempool, p2p, GRPC_PORT);

  // 6. Start Block Production Loop
  console.log(`Starting block production every ${BLOCK_TIME}ms...`);
  setInterval(async () => {
    try {
      const newBlock: Block = await consensus.createBlock();
      console.log(`Attempting to create block #${newBlock.height} as validator ${validator.publicKey.substring(0,15)}...`);
      const success = await blockchain.addBlock(newBlock);
      if (success) {
        p2p.broadcastBlock(newBlock);
        console.log(`Successfully created and added block #${newBlock.height}`);
      }
    } catch (error: any) {
      // We expect errors like "Not our turn", so we only log other errors.
      if (!error.message.includes('Not our turn')) {
        console.error('Error during block creation:', error.message);
      }
    }
  }, BLOCK_TIME);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down node...');
    await storage.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error('Unhandled error during node startup:', error);
  process.exit(1);
});