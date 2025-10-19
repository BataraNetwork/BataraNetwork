import * as net from 'net';
import { Block, Transaction } from '../types';
import { Blockchain } from '../blockchain';
import { Mempool } from '../mempool';

enum MessageType {
    NEW_BLOCK = 'NEW_BLOCK',
    NEW_TRANSACTION = 'NEW_TRANSACTION',
}

interface P2PMessage {
    type: MessageType;
    payload: any;
}

export class P2pService {
    private server: net.Server;
    private sockets: net.Socket[] = [];

    constructor(private blockchain: Blockchain, private mempool: Mempool) {
        this.server = net.createServer(socket => this.handleNewSocket(socket));
    }

    public listen(port: number, peers: string[]) {
        this.server.listen(port, () => {
            console.log(`P2P server listening on port ${port}`);
        });

        peers.forEach(peer => this.connectToPeer(peer));
    }

    private connectToPeer(peerAddress: string) {
        if (!peerAddress) return;
        const [host, portStr] = peerAddress.split(':');
        const port = parseInt(portStr, 10);

        const socket = net.createConnection({ host, port }, () => {
            console.log(`Connected to peer: ${peerAddress}`);
            this.handleNewSocket(socket);
        });

        socket.on('error', (err) => {
            console.error(`Failed to connect to peer ${peerAddress}:`, err.message);
        });
    }

    private handleNewSocket(socket: net.Socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`New peer connected: ${remoteAddress}`);
        this.sockets.push(socket);

        let dataBuffer = '';
        socket.on('data', (data) => {
            dataBuffer += data.toString();
            // Process newline-delimited JSON messages
            let boundary = dataBuffer.indexOf('\n');
            while (boundary !== -1) {
                const messageStr = dataBuffer.substring(0, boundary);
                dataBuffer = dataBuffer.substring(boundary + 1);
                this.handleMessage(messageStr);
                boundary = dataBuffer.indexOf('\n');
            }
        });

        socket.on('close', () => {
            console.log(`Peer disconnected: ${remoteAddress}`);
            this.sockets = this.sockets.filter(s => s !== socket);
        });

        socket.on('error', (err) => {
            console.error(`Socket error from ${remoteAddress}:`, err.message);
        });
    }

    private handleMessage(messageStr: string) {
        try {
            const message: P2PMessage = JSON.parse(messageStr);
            console.log('Received P2P message:', message.type);

            switch (message.type) {
                case MessageType.NEW_BLOCK:
                    this.blockchain.addBlock(message.payload as Block);
                    break;
                case MessageType.NEW_TRANSACTION:
                    this.mempool.addTransaction(message.payload as Transaction);
                    break;
                default:
                    console.warn('Received unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Failed to parse P2P message:', error);
        }
    }

    private broadcast(message: P2PMessage) {
        const messageString = JSON.stringify(message) + '\n';
        this.sockets.forEach(socket => {
            socket.write(messageString);
        });
    }

    public broadcastTransaction(transaction: Transaction): void {
        this.broadcast({
            type: MessageType.NEW_TRANSACTION,
            payload: transaction,
        });
    }

    public broadcastBlock(block: Block): void {
        this.broadcast({
            type: MessageType.NEW_BLOCK,
            payload: block,
        });
    }
}
