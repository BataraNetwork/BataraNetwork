# Bataranetwork Python SDK

This is the official Python SDK for interacting with a Bataranetwork blockchain node. It provides a simple, convenient, and fully type-hinted way to query the blockchain, create transactions, and broadcast them to the network.

## Features

-   Query node status, blocks, and accounts.
-   Full cryptography suite for wallet management (creation, signing, PEM format).
-   High-level methods for creating and broadcasting all transaction types:
    -   Token Transfers (BTR)
    -   Smart Contract Deployment & Calls
    -   Staking & Governance
-   Modern Pythonic design with full type hinting.

## Installation

```sh
# From the sdk/py directory
pip install .
# Or for development
pip install -e .
```
This will install the `batara-sdk` package and its dependencies (`requests`, `ecdsa`).

## Usage

### 1. Initialize the Client

```python
from batara_sdk import BataraClient

def main():
    client = BataraClient(node_url="http://localhost:3000")

    # Example: Get node status
    try:
        status = client.get_status()
        print(f"Latest Block Height: {status['latestBlockHeight']}")
    except Exception as e:
        print(f"Error getting status: {e}")

if __name__ == "__main__":
    main()
```

### 2. Wallet Management

The SDK provides a `Wallet` utility for creating and managing cryptographic keys.

```python
from batara_sdk.wallet import Wallet

# Create a new wallet
wallet = Wallet.create()

print("New Wallet Created!")
print(f"Public Key (Address):\n{wallet.public_key}")
# Private key should be stored securely
# print(f"Private Key:\n{wallet.private_key}")

# Save the wallet to a file
wallet.save("my_wallet.json")

# Load a wallet from a file
loaded_wallet = Wallet.load("my_wallet.json")
print(f"Loaded public key: {loaded_wallet.public_key}")
```

### 3. Creating and Broadcasting a Transaction

Here's a complete example of sending a token transfer. The same pattern applies to all other transaction types.

```python
from batara_sdk import BataraClient
from batara_sdk.wallet import Wallet

def main():
    # 1. Setup client and wallet
    client = BataraClient(node_url="http://localhost:3000")
    try:
        wallet = Wallet.load("my_wallet.json")
    except FileNotFoundError:
        print("Wallet not found. Please create one first.")
        return

    # 2. Get the current nonce for the sender's account
    try:
        account = client.get_account(wallet.public_key)
        nonce = account['nonce']
    except Exception as e:
        print(f"Failed to get account details: {e}")
        return

    # 3. Define the transaction details
    to_address = "recipient-public-key-here..."
    # Amount is denominated in BTR
    amount = 100
    # Fee is denominated in BTR
    fee = 1

    # 4. Use the high-level client method to create, sign, and broadcast
    try:
        resp = client.transfer_tokens(
            wallet=wallet,
            to=to_address,
            amount=amount,
            fee=fee,
            nonce=nonce
        )
        print("Transaction broadcasted successfully!")
        print(f"Transaction ID: {resp['transactionId']}")
    except Exception as e:
        print(f"Failed to transfer tokens: {e}")


if __name__ == "__main__":
    main()
```