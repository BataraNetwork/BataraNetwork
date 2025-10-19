# BataraNetwork API Specifications

This document provides specifications for the BataraNetwork node's public APIs.

## HTTP RPC API

The HTTP API provides a standard RESTful interface for interacting with the node.

-   **Base URL**: `http://<node-ip>:3000`
-   **Content-Type**: `application/json`

### Endpoints

-   `GET /health`
    -   **Description**: Checks if the node is running and healthy.
    -   **Success Response (200)**: `{ "status": "UP" }`

-   `GET /status`
    -   **Description**: Retrieves the current status of the blockchain.
    -   **Success Response (200)**:
        ```json
        {
          "blockHeight": 1234,
          "lastBlockHash": "0xabc...",
          "version": "0.1.0"
        }
        ```

-   `GET /block/:height`
    -   **Description**: Gets a specific block by its height.
    -   **Success Response (200)**: A block object.
    -   **Error Response (404)**: If the block is not found.

-   `POST /broadcast_tx`
    -   **Description**: Broadcasts a new transaction to the network's mempool.
    -   **Request Body**: A transaction object.
    -   **Success Response (200)**: `{ "hash": "0xdef..." }`

## gRPC API

The gRPC API offers a high-performance, strongly-typed interface based on Protocol Buffers.

-   **Service**: `BataraNode`
-   **Proto file**: `core/proto/rpc.proto`

### Methods

-   `rpc GetStatus(Empty) returns (StatusResponse)`
    -   **Description**: Retrieves the current status of the blockchain.

-   `rpc GetBlock(BlockRequest) returns (BlockResponse)`
    -   **Description**: Gets a block by its height.

-   `rpc BroadcastTransaction(TransactionRequest) returns (TransactionResponse)`
    -   **Description**: Broadcasts a new transaction.
