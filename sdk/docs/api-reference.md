# Bataranetwork SDK API Reference

This document provides instructions and examples for using the Bataranetwork SDKs in JavaScript/TypeScript and Python.

## JavaScript / TypeScript SDK

The JS SDK provides a simple client to interact with a Bataranetwork node's HTTP RPC API.

### Installation

```bash
npm install @bataranetwork/sdk-js
```

### Usage

```typescript
import { BataraClient, Transaction } from '@bataranetwork/sdk-js';

const client = new BataraClient('http://localhost:3000');

async function main() {
  // Get node status
  const status = await client.getStatus();
  console.log('Node Status:', status);

  // Get a specific block
  const block = await client.getBlock(1);
  console.log('Block #1:', block);

  // Broadcast a transaction
  const newTx: Transaction = {
    id: 'tx12345',
    from: 'address-A',
    to: 'address-B',
    amount: 100,
    signature: 'signed-data'
  };
  const txResponse = await client.broadcastTransaction(newTx);
  console.log('Transaction Response:', txResponse);
}

main().catch(console.error);
```

## Python SDK

The Python SDK allows for easy interaction with the Bataranetwork node from Python applications.

### Installation

```bash
pip install batara_sdk
```

### Usage

```python
from batara_sdk import BataraClient

client = BataraClient(node_url='http://localhost:3000')

def main():
    # Get node status
    status = client.get_status()
    print(f"Node Status: {status}")

    # Get a specific block
    block = client.get_block(1)
    print(f"Block #1: {block}")

    # Broadcast a transaction
    new_tx = {
        "id": "tx67890",
        "from": "address-C",
        "to": "address-D",
        "amount": 50,
        "signature": "signed-data-py"
    }
    tx_response = client.broadcast_transaction(new_tx)
    print(f"Transaction Response: {tx_response}")

if __name__ == "__main__":
    main()
```
