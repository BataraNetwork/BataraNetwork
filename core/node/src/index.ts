// FIX: Import `process` module to provide correct types for `process.on` and `process.exit`.
import process from 'process';
import { Blockchain } from './blockchain';
import { PoAConsensus } from './consensus/poa';
import { Mempool } from './mempool';
import { GrpcServer } from './rpc/grpcServer';
import { HttpServer } from './rpc/httpServer';
import { LevelStorage } from './storage/level';
import { Validator } from './validator/validator';
import { P2pService } from './p2p/p2pService';
import { Block } from './types';

const DB_PATH = process.env.DB_PATH || './db';
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50051', 10);
const P2P_PORT = parseInt(process.env.P2P_PORT || '6001', 10);
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];
const BLOCK_TIME = parseInt(process.env.BLOCK_TIME || '5000', 10); // 5 seconds

async function main() {
  // 1. Initialize Storage
  const storage = new LevelStorage(DB_PATH);
  await storage.open();

  // 2. Initialize Core Components
  const mempool = new Mempool();
  const blockchain = new Blockchain(storage, mempool);
  await blockchain.initialize();
  
  const p2p = new P2pService(blockchain, mempool);

  // 3. Initialize Validator and Consensus
  const validator = new Validator();
  const consensus = new PoAConsensus(blockchain, mempool, validator);

  // 4. Start P2P and RPC Servers
  p2p.listen(P2P_PORT, PEERS);
  new HttpServer(blockchain, mempool, p2p, HTTP_PORT);
  new GrpcServer(blockchain, mempool, p2p, GRPC_PORT);

  // 5. Start Block Production
  console.log(`Starting block production every ${BLOCK_TIME}ms...`);
  setInterval(async () => {
    try {
      console.log('Attempting to create a new block...');
      const newBlock: Block = await consensus.createBlock();
      const success = await blockchain.addBlock(newBlock);
      if (success) {
        p2p.broadcastBlock(newBlock);
        console.log(`Successfully created and added block #${newBlock.height}`);
      }
    } catch (error) {
      console.error('Error during block creation:', error);
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