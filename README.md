# Bataranetwork: A Comprehensive Blockchain & DevOps AI Toolkit

Welcome to the Bataranetwork project! This repository contains a full-featured, simulated blockchain node and a powerful, AI-driven DevOps Dashboard designed to provide a complete, enterprise-grade experience for blockchain management and operations.

The project is architected as a monorepo, containing the core blockchain node, multiple SDKs, a block explorer, and the sophisticated DevOps dashboard frontend.

![Dashboard Screenshot Placeholder](https://i.imgur.com/your-screenshot.png)
*(A real screenshot of the dashboard should be placed here)*

## 🚀 DevOps Dashboard - The Command Center

The heart of this project is a modern, React-based DevOps dashboard that provides a comprehensive suite of tools for managing and monitoring the Bataranetwork node.

### Key Features

-   **🤖 AI Config Generator**: Generate production-ready configuration files (`Dockerfile`, `Kubernetes`, `Helm`, etc.) with natural language prompts, powered by the Gemini API.
-   **📈 Real-time Monitoring**: A live dashboard displaying key node metrics like block height, pending transactions, CPU/memory usage, and more.
-   **🧠 AI Anomaly Detection**: An AIOps feature that uses the Gemini API to analyze metric history and proactively identify unusual patterns or potential issues.
-   **🛡️ AI Security Scanner**: Analyze configuration files for security vulnerabilities and get AI-powered remediation advice.
-   **🚨 Alert Management**: View and manage system alerts. Includes an AI feature to generate step-by-step remediation plans for active alerts.
-   **📜 Live Log Streaming**: A real-time log viewer with search, filtering, and an AI analysis feature to summarize log patterns and errors.
-   **🚀 CI/CD Pipeline Simulation**: A visual dashboard to trigger, monitor, and approve a simulated CI/CD pipeline for the node, including deployment history.
-   **🗳️ On-Chain Governance UI**: A dedicated interface to view, submit, and vote on on-chain governance proposals.
-   **💰 Staking & Validator UI**: An interface to view network validators and simulate staking BTR tokens.
-   **📜 Smart Contract UI**: A tool to view and interact with deployed smart contracts directly from the dashboard.
-   **🔐 Role-Based Access Control (RBAC)**: A simulated multi-user environment with roles like `Admin`, `DevOps`, and `Auditor`, where UI actions are restricted based on permissions.
-   **🔑 API Key Management**: A secure UI for administrators to create and revoke API keys for the node.
-   **📋 Audit Trail**: A comprehensive log of all significant user actions performed within the dashboard.

### Technology Stack

-   **Frontend**: React, TypeScript, Vite, Tailwind CSS
-   **AI Integration**: Google Gemini API
-   **Charting**: Recharts

### Getting Started with the Dashboard

1.  **Set `API_KEY`**: To enable the AI features, you must set your Google Gemini API key as an environment variable named `API_KEY`. See `docs/development-guide.md` for detailed instructions.
2.  **Install Dependencies**: Run `npm install` at the root of the project.
3.  **Run the Dashboard**: Run `npm run dev`. This will start the Vite development server.

## 🔗 Bataranetwork Blockchain Core

The `core/node` is a fully-featured blockchain node built from scratch in TypeScript. It has evolved from a simple PoA simulation into a stateful, Proof-of-Stake L1 prototype.

### Core Features

-   **Proof-of-Stake (PoS) Consensus**: A simulated PoS mechanism selects validators in a round-robin fashion.
-   **State Management**: A state manager tracks account balances (in BTR) and nonces, making transactions stateful.
-   **WASM Smart Contract Engine**: A simulated engine for deploying and executing WASM-based smart contracts.
-   **On-Chain Governance**: A module for submitting and voting on proposals directly on the blockchain.
-   **P2P Networking**: A simple TCP-based peer-to-peer layer for broadcasting blocks and transactions.
-   **RPC APIs**: Exposes both a JSON RPC (HTTP) and a gRPC API for client interaction.
-   **Persistent Storage**: Uses LevelDB for storing blockchain data.

## The BATARA (BTR) Token

**BATARA (BTR)** is the native utility token of the Bataranetwork. It is essential for the functioning of the ecosystem and is used for three primary purposes:

1.  **Transaction Fees**: BTR is used to pay for all transactions on the network, preventing spam and compensating validators.
2.  **Staking**: BTR is staked by validators to secure the network under the Proof-of-Stake consensus mechanism. Token holders can delegate their BTR to validators to participate in securing the network and earn rewards.
3.  **Governance**: BTR holders can participate in on-chain governance by voting on proposals that shape the future of the network, such as protocol upgrades or changes to network parameters.

## 🛠️ Developer Ecosystem

-   **JavaScript/TypeScript SDK (`sdk/js`)**: A comprehensive SDK for building web applications and services that interact with the node.
-   **Go SDK (`sdk/go`)**: An idiomatic Go SDK for building backend services and tools. Includes a full cryptography suite.
-   **Python SDK (`sdk/py`)**: An idiomatic Python SDK, fully type-hinted, for scripting, automation, and data analysis.
-   **Node.js CLI (`core/cli`)**: A command-line interface for wallet management and on-chain interactions.
-   **Go CLI (`sdk/go/cmd/batara-cli-go`)**: A native Go CLI for deploying and calling smart contracts.
-   **Block Explorer (`explorer`)**: A simple web-based explorer to view blocks and transactions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing.md) for more details on how to get involved.

## 📄 License

This project is licensed under the MIT License.