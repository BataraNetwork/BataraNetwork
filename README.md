# Bataranetwork: A Comprehensive Blockchain & DevOps AI Toolkit

Welcome to the Bataranetwork project! This repository contains a full-featured, simulated blockchain node and a powerful, AI-driven DevOps Dashboard designed to provide a complete, enterprise-grade experience for blockchain management and operations.

The project is architected as a monorepo, containing the core blockchain node, multiple SDKs, a block explorer, and the sophisticated DevOps dashboard frontend.

![Dashboard Screenshot Placeholder](https://i.imgur.com/your-screenshot.png)
*(A real screenshot of the dashboard should be placed here)*

## 🚀 Quick Start

Get the entire Bataranetwork ecosystem—the blockchain node, the block explorer, and the DevOps dashboard—running in minutes.

### Prerequisites
- Node.js (v20+)
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose

### Running the Ecosystem
1.  **Set Gemini API Key**: The DevOps Dashboard uses the Google Gemini API for its AI features. Create a `.env` file in the project root and add your key:
    ```
    API_KEY="YOUR_GEMINI_API_KEY"
    ```
    See the [Development Guide](docs/development-guide.md) for more details.

2.  **Install Dependencies**: Install all dependencies for all packages in the monorepo.
    ```sh
    pnpm install
    ```

3.  **Run in Development Mode**: This command concurrently starts the blockchain node, the block explorer (frontend & backend), and the DevOps dashboard with hot-reloading.
    ```sh
    pnpm dev
    ```

You can now access:
- **DevOps Dashboard**: `http://localhost:5173`
- **Block Explorer**: `http://localhost:5174` (or its configured port)
- **Node HTTP API**: `http://localhost:3000`

## 📦 Monorepo Overview

-   `src/`: The main DevOps Dashboard React application.
-   `core/node/`: The core blockchain node built in TypeScript.
-   `explorer/`: The public-facing block explorer, with its own frontend and backend.
-   `sdk/`: SDKs for interacting with the node in different languages (JS, Go, Python).
-   `api/`: Serverless functions that power the AI features of the DevOps Dashboard.
-   `docs/`: All project documentation, including architecture, API specs, and guides.

## 🔗 Bataranetwork Blockchain Core

The `core/node` is a fully-featured blockchain node built from scratch in TypeScript. It has evolved from a simple PoA simulation into a stateful, Proof-of-Stake L1 prototype. See the [Architecture Overview](docs/architecture-overview.md) for a deep dive.

### Core Features

-   **Proof-of-Stake (PoS) Consensus**: A simulated PoS mechanism selects validators in a round-robin fashion.
-   **State Management**: A state manager tracks account balances (in BTR) and nonces, making transactions stateful.
-   **WASM Smart Contract Engine**: A simulated engine for deploying and executing WASM-based smart contracts.
-   **On-Chain Governance**: A module for submitting and voting on proposals directly on the blockchain.
-   **P2P Networking**: A simple TCP-based peer-to-peer layer for broadcasting blocks and transactions.
-   **RPC APIs**: Exposes both a JSON RPC (HTTP) and a gRPC API for client interaction. See the [API Specification](docs/api-specifications.md).
-   **Persistent Storage**: Uses LevelDB for storing blockchain data.

## The BATARA (BTR) Token

**BATARA (BTR)** is the native utility token of the Bataranetwork. It is essential for the functioning of the ecosystem and is used for three primary purposes:

1.  **Transaction Fees**: BTR is used to pay for all transactions on the network, preventing spam and compensating validators.
2.  **Staking**: BTR is staked by validators to secure the network under the Proof-of-Stake consensus mechanism. Token holders can delegate their BTR to validators to participate in securing the network and earn rewards.
3.  **Governance**: BTR holders can participate in on-chain governance by voting on proposals that shape the future of the network, such as protocol upgrades or changes to network parameters.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for more details on how to get involved.

## 📄 License

This project is licensed under the MIT License.
