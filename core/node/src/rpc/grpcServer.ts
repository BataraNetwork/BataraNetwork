// Note: This requires a proto file and generated code.
// For simplicity, this is a placeholder showing how it would be structured.
// To make this fully work, you would need to:
// 1. Create a `batara.proto` file in `src/proto`.
// 2. Use `grpc-tools` to generate JS files from the proto.
// 3. Implement the server logic below.

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
// FIX: Import 'process' to use process.cwd() as an alternative to __dirname.
import process from 'process';
import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';
import { P2pService } from '../p2p/p2pService';
import { Transaction } from '../types';

// FIX: Replaced __dirname with a path relative to the current working directory
// to avoid type errors and make the path more robust, assuming the application
// is run from the 'core/node' directory.
const PROTO_PATH = path.join(process.cwd(), 'src/proto/batara.proto');

export class GrpcServer {
    private server: grpc.Server;
    private blockchain: Blockchain;
    private mempool: Mempool;
    private p2p: P2pService;

    constructor(blockchain: Blockchain, mempool: Mempool, p2p: P2pService, port: number) {
        this.blockchain = blockchain;
        this.mempool = mempool;
        this.p2p = p2p;
        this.server = new grpc.Server();
        this.initializeServer();
        this.server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
            if (err) {
                console.error(`gRPC server error: ${err.message}`);
                return;
            }
            console.log(`gRPC server listening on port ${boundPort}`);
            this.server.start();
        });
    }

    private initializeServer(): void {
        try {
            const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });
            const bataraProto: any = grpc.loadPackageDefinition(packageDefinition).batara;

            this.server.addService(bataraProto.BataraService.service, {
                GetStatus: this.getStatus.bind(this),
                GetBlock: this.getBlock.bind(this),
                BroadcastTransaction: this.broadcastTransaction.bind(this),
            });
        } catch (error) {
            console.warn("Could not initialize gRPC server. Did you generate proto files? `src/proto/batara.proto` might be missing.");
        }
    }

    private getStatus(call: any, callback: any): void {
        callback(null, {
            latestBlockHeight: this.blockchain.getLatestBlock().height,
        });
    }

    private async getBlock(call: any, callback: any): Promise<void> {
        const height = call.request.height;
        const block = await this.blockchain.getBlock(height);
        if (block) {
            // Assuming block structure matches proto definition
            callback(null, block);
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: `Block #${height} not found`,
            });
        }
    }

    private broadcastTransaction(call: any, callback: any): void {
        const transaction: Transaction = call.request.transaction;
        // Basic validation for common transaction properties
        // The mempool will perform more thorough, type-specific validation.
        // FIX: Added nonce check.
        if (!transaction || !transaction.id || !transaction.from || !transaction.signature || !transaction.type || typeof transaction.nonce !== 'number') {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: 'Invalid transaction format',
            });
        }
    
        const success = this.mempool.addTransaction(transaction);
        if (success) {
            this.p2p.broadcastTransaction(transaction);
            callback(null, {
                transaction_id: transaction.id,
                message: 'Transaction added to mempool',
            });
        } else {
            callback({
                code: grpc.status.ALREADY_EXISTS,
                details: 'Transaction already in mempool',
            });
        }
    }
}