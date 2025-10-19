# Bataranetwork Architecture Overview

This document provides a high-level overview of the Bataranetwork's core components and how they interact.

## Core Node Components

The Bataranetwork node is a self-contained application responsible for maintaining the blockchain's state, executing transactions, and communicating with other nodes.

### 1. State Manager

The State Manager is the heart of the node's stateful logic. It is responsible for managing the "world state" of the blockchain.

-   **Account Management**: Tracks the balance (denominated in the native **BTR** token) and nonce (transaction count) of every account on the network.
-   **State Transitions**: Applies the results of transactions to the world state. For example, in a `TRANSFER` transaction, it debits the sender's account and credits the receiver's account.
-   **Persistence**: Persists the state to the underlying LevelDB database.

### 2. Blockchain

The `Blockchain` class orchestrates the core logic of the chain itself.

-   **Block Management**: Manages the sequence of blocks, ensuring they are correctly linked and validated.
-   **Transaction Processing**: When a new block is created, the Blockchain class iterates through its transactions and delegates their execution to the appropriate modules (State Manager, Wasm Engine, etc.).
-   **Genesis Block**: Creates the initial "genesis" block that starts the chain.

### 3. Consensus Mechanism (Proof-of-Stake)

The consensus layer is responsible for determining who gets to create the next block.

-   **PoS Logic**: Implements a simulated Proof-of-Stake (PoS) algorithm.
-   **Validator Selection**: It communicates with the **Staking Manager** to determine the correct validator for the next block based on a deterministic, round-robin selection process.

### 4. Staking Manager

This module manages the set of active validators in the Proof-of-Stake system.

-   **Stake Tracking**: Manages the total amount of **BTR** tokens staked for each validator.
-   **Validator Set**: Maintains the list of active validators who are eligible to produce blocks.

### 5. Mempool (Memory Pool)

The Mempool acts as a waiting area for transactions that have been submitted to the node but have not yet been included in a block.

-   **Transaction Validation**: Performs initial validation checks on incoming transactions.
-   **Prioritization**: Sorts transactions, typically by the fee offered, to help block producers select the most profitable transactions to include.

### 6. WASM Smart Contract Engine

This is a simulated engine responsible for executing smart contracts.

-   **Deployment**: Handles `CONTRACT_CREATION` transactions to "deploy" new contracts onto the blockchain.
-   **Execution**: Simulates the execution of contract functions for `CONTRACT_CALL` transactions, allowing contracts to read and modify their own internal state.

### 7. On-Chain Governance Module

This module enables community-driven decision-making directly on the blockchain.

-   **Proposal Lifecycle**: Manages the entire lifecycle of a governance proposal: submission, voting period, and final tallying.
-   **Voting**: Processes `GOVERNANCE_VOTE` transactions, allowing **BTR** token holders (simulated) to cast their votes.

### 8. P2P (Peer-to-Peer) Service

The P2P service allows the node to communicate with other nodes in the network.

-   **Broadcasting**: When a node creates a new block or receives a new transaction, it broadcasts it to all its connected peers.
-   **Peer Discovery**: Manages connections to a list of initial peers.

### 9. RPC Servers (HTTP & gRPC)

These servers provide the external APIs for clients (like SDKs, CLIs, and explorers) to interact with the node.

-   **HTTP Server**: Provides a standard JSON-RPC interface.
-   **gRPC Server**: Offers a high-performance, protobuf-based interface.

### 10. Storage (LevelDB)

The storage layer is responsible for persisting all blockchain data to disk.

-   **Data Store**: Uses LevelDB, a simple key-value store, to save blocks and account state, ensuring data survives node restarts.

## Diagram Flow

```
+----------------+      +----------------+      +-----------------+
|   RPC Clients  |----->|   RPC Servers  |----->|     Mempool     |
| (SDKs, CLIs)   |      | (HTTP, gRPC)   |      | (Pending Txs)   |
+----------------+      +----------------+      +-------+---------+
                                                        |
                                                        |
+----------------+      +-----------------+      +------v----------+
|  P2P Network   |<---->|   P2P Service   |      |   Consensus     |
|  (Other Nodes) |      +-----------------+      | (PoS - Chooses  |
+----------------+                               | Validator,      |
        ^                                        | Creates Block)  |
        |                                        +-------+---------+
        |                                                |
        |                                                v
+-------+------------------------------------------------+---------+
|                            Blockchain                            |
|  (Adds Block, Processes Transactions via other modules)          |
|                                                                  |
|  +-----------------+ +-----------------+ +-----------------+     |
|  |  State Manager  | |   WASM Engine   | | Governance Mod  | ... |
|  | (Balances/BTR)  | |  (Contracts)    | |  (Proposals)    |     |
|  +-------+---------+ +-----------------+ +-----------------+     |
|          |                                                       |
|          v                                                       |
|  +-------+---------+                                             |
|  |     Storage     |                                             |
|  |    (LevelDB)    |                                             |
|  +-----------------+                                             |
+------------------------------------------------------------------+

```