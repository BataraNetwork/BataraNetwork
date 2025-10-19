# Bataranetwork Architecture Overview

This document provides a high-level overview of the Bataranetwork's architecture, components, and how they interact.

## Core Components

The Bataranetwork ecosystem is designed to be modular. The key components are:

1.  **Core Node (`core/node`)**: The heart of the network. It's responsible for maintaining the blockchain ledger, executing transactions and smart contracts, and reaching consensus with other nodes.
2.  **AI Agents (`agents`)**: A suite of autonomous agents that perform various DevOps and security tasks.
3.  **Block Explorer (`explorer`)**: A web-based user interface for viewing blocks, transactions, and other network data in a human-readable format.
4.  **SDKs (`sdk`)**: Libraries for JavaScript and Python that make it easy for developers to build applications that interact with the Bataranetwork.

## Core Node Architecture

The core node itself is composed of several internal modules:

-   **RPC Layer (`rpc/`)**: Exposes the node's functionality to the outside world. It provides both a standard HTTP/JSON-RPC server and a high-performance gRPC server. This is the primary interface for SDKs, CLIs, and the Block Explorer.

-   **Consensus Engine (`consensus/`)**: The mechanism by which nodes agree on the state of the network. The implementation uses **Proof-of-Stake (PoS)**, where validators stake tokens to get a chance to produce blocks. This module is designed to be pluggable.

-   **State Manager (`state/`)**: The source of truth for the "world state" of the blockchain. It is responsible for tracking core state data like account balances and transaction nonces (to prevent replay attacks). It provides a simple API for the `Blockchain` module to query and update state, which is then persisted by the `Storage` layer.

-   **Staking Manager (`staking/`)**: A crucial component of the PoS system. It manages the state of validator stakes, processes staking/unstaking transactions, and is responsible for selecting the next block producer based on the staking protocol rules.

-   **Smart Contract Engine (`vm/`)**: A simulated **WebAssembly (WASM) based Virtual Machine**. This engine is responsible for deploying new smart contracts and executing function calls on existing contracts. It manages contract state within the context of the blockchain's overall state.

-   **Governance Module (`governance/`)**: An on-chain system that allows token holders to participate in the protocol's evolution. It manages the lifecycle of proposals, from submission to voting and final tallying.

-   **Transaction Mempool (`mempool.ts`)**: An in-memory pool of pending transactions that have been submitted to the network but not yet included in a block. The consensus engine pulls transactions from the mempool when creating a new block.

-   **P2P Networking Layer (`p2p/`)**: Manages the communication between nodes in the network. It uses a TCP-based protocol to discover peers, maintain connections, and broadcast new blocks and transactions. This ensures that all nodes have a consistent view of the blockchain.

-   **Storage (`storage/`)**: The persistence layer for the blockchain data. Bataranetwork uses LevelDB, a lightweight and high-performance key-value store, to save blocks, account states, and other data to disk. This ensures that the blockchain's history is durable.

-   **Validator Logic (`validator/`)**: Manages the node's identity, including its cryptographic keys. In a PoS network, the validator is responsible for signing the blocks it creates.

## Data Flow Diagram

### Transaction Lifecycle

1.  A **User/SDK** creates and signs a transaction (e.g., Transfer, Stake, Contract Call, Vote), including the correct `nonce` for their account.
2.  The transaction is submitted to a node via its **RPC Layer** (HTTP or gRPC).
3.  The node validates the transaction and adds it to its **Mempool**.
4.  The transaction is broadcast to all other nodes via the **P2P Layer**.
5.  The **Staking Manager** determines the validator for the next block. When it's a validator's turn, its **Consensus Engine** selects transactions from the mempool to create a new block.
6.  As the block is processed, each transaction is passed to the **Blockchain** module, which uses the **State Manager** to validate nonce and sufficient balance, and then update the sender/receiver accounts. Module-specific logic is then executed (e.g., a `CONTRACT_CALL` is sent to the **WASM Engine**).
7.  The new block is added to the validator's local **Blockchain** and saved to **Storage**.
8.  The new block is broadcast to all other nodes via the **P2P Layer**.
9.  Other nodes receive the block, validate it (including re-processing all its transactions against their own state), and add it to their own local blockchain.