# Bataranetwork API Specifications

This document provides specifications for the Bataranetwork node's public HTTP RPC API. This API is the primary way for clients like SDKs, explorers, and dashboards to interact with the blockchain.

-   **Base URL**: `http://<node-ip>:3000`
-   **Content-Type**: `application/json`

---

## General & Blockchain Endpoints

### `GET /health`

-   **Description**: Checks if the node is running and responsive. Used for liveness/readiness probes.
-   **Success Response (200 OK)**: `OK` (string)
-   **Error Response (500 Internal Server Error)**: If the node's internal state is inconsistent.

### `GET /status`

-   **Description**: Retrieves a high-level overview of the blockchain's current status and the node's performance.
-   **Success Response (200 OK)**:
    ```json
    {
      "latestBlockHeight": 1234,
      "pendingTransactions": 15,
      "validatorCount": 5,
      "totalStaked": 12500000,
      "activeProposals": 2,
      "uptime": 3600,
      "memoryUsage": 15.75,
      "cpuUsage": 25.5
    }
    ```

### `GET /block/:height`

-   **Description**: Gets a specific block by its height.
-   **URL Parameters**:
    -   `height` (number): The block number to retrieve.
-   **Success Response (200 OK)**: A full block object.
-   **Error Response (404 Not Found)**: If the block at that height does not exist.

### `GET /blocks/latest`

-   **Description**: Retrieves a list of the most recent blocks.
-   **Query Parameters**:
    -   `count` (number, optional, default: 10): The number of recent blocks to fetch.
-   **Success Response (200 OK)**: An array of block objects.

---

## Transaction & Mempool Endpoints

### `POST /transaction`

-   **Description**: Broadcasts a new, signed transaction to the node's mempool.
-   **Request Body**: A signed transaction object.
-   **Success Response (201 Created)**:
    ```json
    {
      "message": "Transaction added to mempool",
      "transactionId": "a1b2c3..."
    }
    ```
-   **Error Response (400 Bad Request)**: If the transaction fails validation (e.g., bad signature, invalid format).

### `GET /transactions/pending`

-   **Description**: Retrieves all transactions currently pending in the mempool.
-   **Success Response (200 OK)**: An array of transaction objects.

---

## State & Account Endpoints

### `GET /account/:address`

-   **Description**: Retrieves the state of a specific account (balance and nonce).
-   **URL Parameters**:
    -   `address` (string): The full, URL-encoded PEM public key of the account.
-   **Success Response (200 OK)**:
    ```json
    {
      "address": "-----BEGIN PUBLIC KEY-----\n...",
      "balance": 50000,
      "nonce": 5
    }
    ```

---

## Staking & Consensus Endpoints

### `GET /staking/validators`

-   **Description**: Retrieves the list of all active validators and their current stake.
-   **Success Response (200 OK)**: An array of validator objects.
    ```json
    [
      {
        "address": "-----BEGIN PUBLIC KEY-----\n...",
        "amount": 100000
      }
    ]
    ```

---

## Governance Endpoints

### `GET /governance/proposals`

-   **Description**: Retrieves the list of all governance proposals (active and historical).
-   **Success Response (200 OK)**: An array of proposal objects.
    ```json
    [
        {
            "id": "prop123...",
            "proposer": "---BEGIN...",
            "title": "Protocol Upgrade v2",
            "description": "This proposal...",
            "startBlock": 1000,
            "endBlock": 2000,
            "status": "ACTIVE",
            "votes": { "yes": 50, "no": 10, "abstain": 5 }
        }
    ]
    ```

---

## Smart Contract Endpoints

### `GET /contracts`

-   **Description**: Retrieves a list of all smart contracts deployed on the network.
-   **Success Response (200 OK)**: An array of objects, each containing the contract's ID and deployer address.
    ```json
    [
        {
            "id": "contract123...",
            "from": "deployer-address-pem..."
        }
    ]
    ```

### `GET /contract/:id/state`

-   **Description**: Retrieves the current internal state of a specific smart contract.
-   **URL Parameters**:
    -   `id` (string): The ID of the smart contract.
-   **Success Response (200 OK)**: A JSON object representing the contract's key-value state.
    ```json
    {
        "owner": "owner-address...",
        "value": 42
    }
    ```
