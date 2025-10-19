# Bataranetwork Architecture Overview

This document provides a high-level overview of the Bataranetwork's architecture, components, and how they interact.

## Core Components

The Bataranetwork ecosystem is designed to be modular. The key components are:

1.  **Core Node (`core/node`)**: The heart of the network. It's responsible for maintaining the blockchain ledger, executing transactions, and reaching consensus with other nodes.
2.  **AI Agents (`agents`)**: A suite of autonomous agents that perform various DevOps and security tasks.
3.  **Block Explorer (`explorer`)**: A web-based user interface for viewing blocks, transactions, and other network data in a human-readable format.
4.  **SDKs (`sdk`)**: Libraries for JavaScript and Python that make it easy for developers to build applications that interact with the Bataranetwork.

## Core Node Architecture

The core node itself is composed of several internal modules:

-   **RPC Layer (`rpc/`)**: Exposes the node's functionality to the outside world. It provides both a standard HTTP/JSON-RPC server and a high-performance gRPC server. This is the primary interface for SDKs, CLIs, and the Block Explorer.

-   **Consensus Engine (`consensus/`)**: The mechanism by which nodes agree on the state of the network. The initial implementation uses Proof-of-Authority (PoA), where a set of trusted validators are responsible for creating new blocks. This module is designed to be pluggable, allowing for future upgrades to other consensus algorithms like Proof-of-Stake (PoS).

-   **Transaction Mempool (`mempool.ts`)**: An in-memory pool of pending transactions that have been submitted to the network but not yet included in a block. The consensus engine pulls transactions from the mempool when creating a new block.

-   **P2P Networking Layer (`p2p/`)**: Manages the communication between nodes in the network. It uses a TCP-based protocol to discover peers, maintain connections, and broadcast new blocks and transactions. This ensures that all nodes have a consistent view of the blockchain.

-   **Storage (`storage/`)**: The persistence layer for the blockchain data. Bataranetwork uses LevelDB, a lightweight and high-performance key-value store, to save blocks and other state data to disk. This ensures that the blockchain's history is durable.

-   **Validator Logic (`validator/`)**: Manages the node's identity, including its cryptographic keys. In a PoA network, the validator is responsible for signing the blocks it creates.

## AI Agents Architecture

The AI Agents module (`agents/`) provides a FastAPI-based service with several key functions:

-   **Security Auditor**: An endpoint to trigger vulnerability scans on container images.
-   **Performance Profiler**: An endpoint that returns mock performance metrics for a node (CPU, memory, etc.).
-   **Project Deployer**: An endpoint to simulate the triggering of deployment pipelines.

## Data Flow Diagram

### Transaction Lifecycle

1.  A **User/SDK** creates and signs a transaction.
2.  The transaction is submitted to a node via its **RPC Layer** (HTTP or gRPC).
3.  The node validates the transaction and adds it to its **Mempool**.
4.  The transaction is broadcast to all other nodes via the **P2P Layer**.
5.  When it's a validator's turn, its **Consensus Engine** selects transactions from the mempool to create a new block.
6.  The new block is added to the validator's local **Blockchain** and saved to **Storage**.
7.  The new block is broadcast to all other nodes via the **P2P Layer**.
8.  Other nodes receive the block, validate it, and add it to their own local blockchain.
