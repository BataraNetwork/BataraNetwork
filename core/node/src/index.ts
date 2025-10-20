// core/node/src/index.ts
// FIX: Import the 'process' module to resolve type errors for process.env and process.exit.
import process from 'process';
import { LevelStorage } from './storage/level';
import { Blockchain } from './blockchain';
import { Mempool } from './mempool';
import { P2pService } from './p2p/p2pService';
import { Validator } from './validator/validator';
import { PoSConsensus } from './consensus/pos';
import { HttpServer } from './rpc/httpServer';
import { GrpcServer } from './rpc/grpcServer';
import { StakingManager } from './staking/stakingManager';
import { WasmEngine } from './vm/wasmEngine';
import { GovernanceModule } from './governance/governanceModule';
import { StateManager } from './state/stateManager';
import { generateKeys } from './utils/crypto';

// --- Configuration ---
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '3000', 10);
const GRPC_PORT = parseInt(process.env.GRPC_PORT || '50051', 10);
const P2P_PORT = parseInt(process.env.P2P_PORT || '6001', 10);
const PEERS = process.env.PEERS ? process.env.PEERS.split(',') : [];
const DB_PATH = './db';

// --- Genesis Setup ---
// These are pre-funded accounts for the genesis block
const genesisValidator = new Validator();
const genesisStakers = [
    { address: genesisValidator.publicKey, amount: 100000 }, // Validator starts with a stake
];
const genesisAccounts = [
    { address: genesisValidator.publicKey, balance: 1000000 },
];
// Generate some extra accounts for the frontend users
for(let i=0; i < 4; i++) {
    const { publicKey } = generateKeys();
    console.log(`Generated genesis public key for UI user ${i+1}:\n${publicKey}\n`);
    genesisAccounts.push({ address: publicKey, balance: 50000 });
}


async function main() {
    console.log('Starting Bataranetwork node...');

    // --- Module Initialization ---
    const storage = new LevelStorage(DB_PATH);
    await storage.open();
    console.log('Database opened successfully.');

    const stateManager = new StateManager(storage);
    await stateManager.initializeGenesisState(genesisAccounts);

    const mempool = new Mempool();
    const stakingManager = new StakingManager(genesisStakers);
    const wasmEngine = new WasmEngine(stateManager);
    const governanceModule = new GovernanceModule();

    const blockchain = new Blockchain(
        storage,
        mempool,
        stakingManager,
        wasmEngine,
        governanceModule,
        stateManager
    );
    await blockchain.initialize();

    const p2pService = new P2pService(blockchain, mempool);
    p2pService.listen(P2P_PORT, PEERS);

    // --- Validator and Consensus ---
    // The `validator` instance represents this specific node's identity.
    const validator = genesisValidator; // For simulation, this node is the genesis validator
    const consensus = new PoSConsensus(blockchain, mempool, validator, stakingManager);

    // --- Start RPC Servers ---
    new HttpServer(blockchain, mempool, p2pService, stakingManager, governanceModule, stateManager, wasmEngine, HTTP_PORT);
    new GrpcServer(blockchain, mempool, p2pService, GRPC_PORT);

    // --- Block Production Loop ---
    // Simulate trying to create a block every 5 seconds
    setInterval(async () => {
        try {
            const newBlock = await consensus.createBlock();
            const success = await blockchain.addBlock(newBlock);
            if (success) {
                console.log(`✅ Successfully created and added new block #${newBlock.height}`);
                p2pService.broadcastBlock(newBlock);
            }
        } catch (error: any) {
            // This is expected if it's not our turn to produce a block
            if (error.message.includes("Not our turn")) {
                // console.log(`... Not our turn to produce a block.`);
            } else {
                console.error('Error during block creation:', error.message);
            }
        }
    }, 5000);

    console.log('Bataranetwork node is running.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});