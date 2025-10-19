# Bataranetwork Go SDK

This is the official Go SDK for interacting with a Bataranetwork blockchain node. It provides a simple and convenient way to query the blockchain, create transactions, and broadcast them to the network.

## Features

-   Query node status, blocks, and accounts.
-   Full cryptography suite for wallet management (creation, signing).
-   High-level methods for creating and broadcasting all transaction types:
    -   Token Transfers (BTR)
    -   Smart Contract Deployment & Calls
    -   Staking & Governance
-   Idiomatic Go design and error handling.

## Installation

```sh
go get github.com/your-repo/bataranetwork/sdk/go
```

## Usage

### 1. Initialize the Client

```go
package main

import (
	"fmt"
	"log"

	batarasdk "github.com/your-repo/bataranetwork/sdk/go"
)

func main() {
	client := batarasdk.NewBataraClient("http://localhost:3000")

	// Example: Get node status
	status, err := client.GetStatus()
	if err != nil {
		log.Fatalf("Failed to get status: %v", err)
	}
	fmt.Printf("Latest Block Height: %d\n", status.LatestBlockHeight)
}
```

### 2. Wallet Management

The SDK provides helpers for creating and managing wallets.

```go
// Create a new wallet
wallet, err := batarasdk.CreateWallet()
if err != nil {
    log.Fatalf("Failed to create wallet: %v", err)
}

fmt.Println("New Wallet Created!")
fmt.Printf("Public Key (Address):\n%s\n", wallet.PublicKey)
// Private key should be stored securely and not printed
// fmt.Printf("Private Key:\n%s\n", wallet.PrivateKey)

// You can save and load wallets
err = wallet.SaveToFile("my-wallet.json")
if err != nil {
    log.Fatalf("Failed to save wallet: %v", err)
}

loadedWallet, err := batarasdk.LoadWalletFromFile("my-wallet.json")
if err != nil {
    log.Fatalf("Failed to load wallet: %v", err)
}
fmt.Printf("Loaded public key: %s\n", loadedWallet.PublicKey)
```

### 3. Creating and Broadcasting a Transaction

Here's a complete example of sending a token transfer. The same pattern applies to all other transaction types.

```go
package main

import (
	"fmt"
	"log"

	batarasdk "github.com/your-repo/bataranetwork/sdk/go"
)

func main() {
	// 1. Setup client and wallet
	client := batarasdk.NewBataraClient("http://localhost:3000")
	// Assume wallet is created and loaded
	wallet, err := batarasdk.LoadWalletFromFile("my-wallet.json")
	if err != nil {
		log.Fatalf("Please create a wallet first using the CLI or SDK example.")
	}

	// 2. Get the current nonce for the sender's account
	account, err := client.GetAccount(wallet.PublicKey)
	if err != nil {
		log.Fatalf("Failed to get account details: %v", err)
	}
	
	// 3. Define the transaction details
	toAddress := "recipient-public-key-here..."
	// Amount is denominated in BTR
	amount := uint64(100) 
	// Fee is denominated in BTR
	fee := uint64(1) 

	// 4. Use the high-level client method to create, sign, and broadcast
	resp, err := client.TransferTokens(wallet, toAddress, amount, fee, account.Nonce)
	if err != nil {
		log.Fatalf("Failed to transfer tokens: %v", err)
	}

	fmt.Println("Transaction broadcasted successfully!")
	fmt.Printf("Transaction ID: %s\n", resp.TransactionID)
}
```

### 4. Calling a Smart Contract

```go
// ... (setup client and wallet as above)

// Get the nonce
account, err := client.GetAccount(wallet.PublicKey)
if err != nil {
    log.Fatalf("Failed to get account: %v", err)
}

contractID := "contract-id-from-deployment..."
functionName := "setState"
// Arguments must be JSON-serializable
args := []interface{}{"message", "hello from Go"}
// Fee is denominated in BTR
fee := uint64(2)

resp, err := client.CallContract(wallet, contractID, functionName, args, fee, account.Nonce)
if err != nil {
    log.Fatalf("Failed to call contract: %v", err)
}

fmt.Printf("Contract call broadcasted! Transaction ID: %s\n", resp.TransactionID)
```

## Go CLI

A native Go CLI is provided in `cmd/batara-cli-go` to demonstrate the SDK's usage.

### Build

```sh
# From the sdk/go directory
go build -o batara-cli-go ./cmd/batara-cli-go
```

### Usage

```sh
# Deploy a contract
./batara-cli-go deploy \
  --wallet="/path/to/my-wallet.json" \
  --contract-path="/path/to/contract.wasm" \
  --init-state='{"owner":"your-address"}' \
  --node="http://localhost:3000"

# Call a contract
./batara-cli-go call \
  --wallet="/path/to/my-wallet.json" \
  --contract-id="your-contract-id" \
  --function="myFunction" \
  --args='["arg1", 123]' \
  --node="http://localhost:3000"
```