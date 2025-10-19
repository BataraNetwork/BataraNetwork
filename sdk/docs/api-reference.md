# SDK API Reference

This document provides a reference for the Bataranetwork JavaScript and Python SDKs.

## `BataraClient`

The main entry point for interacting with the Bataranetwork.

### Initialization

**JavaScript/TypeScript:**
```javascript
import { BataraClient } from '@bataranetwork/sdk-js';
const client = new BataraClient('http://localhost:3000');
```

**Python:**
```python
from batara_sdk import BataraClient
client = BataraClient(node_url='http://localhost:3000')
```

## Core Methods

### `getStatus()`

Retrieves the current status of the node.
- **Returns**: A promise/task that resolves to a status object.

### `getBlock(height)`

Retrieves a block by its height.
- **`height`**: `number` - The height of the block to fetch.
- **Returns**: A promise/task that resolves to a block object.

### `getAccount(address)`

Retrieves the state of an account.
- **`address`**: `string` - The public key of the account.
- **Returns**: A promise/task that resolves to an account object containing balance (in BTR) and nonce.

## Transaction Methods

### `broadcastTransaction(tx)`

Broadcasts a pre-signed transaction to the node. This is a low-level method. Prefer using the high-level wrappers below.

### `transferTokens(tx)`
- **`tx`**: A signed `TransferTransaction` object. The `amount` field should be denominated in **BTR**.

### `deployContract(tx)`
- **`tx`**: A signed `ContractCreationTransaction` object.

### `callContract(tx)`
- **`tx`**: A signed `ContractCallTransaction` object.

### `stakeTokens(tx)`
- **`tx`**: A signed `StakeTransaction` object. The `amount` field should be denominated in **BTR**.

### `submitGovernanceProposal(tx)`
- **`tx`**: A signed `GovernanceProposalTransaction` object.

### `castGovernanceVote(tx)`
- **`tx`**: A signed `GovernanceVoteTransaction` object.

## Staking & Governance Methods

### `getValidators()`
- **Returns**: A promise/task that resolves to a list of active validators.

### `getProposals()`
- **Returns**: A promise/task that resolves to a list of governance proposals.