# Bataranetwork Go SDK

This Go SDK provides a client library for interacting with a Bataranetwork node's HTTP RPC API.

## Installation

This SDK is a Go module. You can add it to your project using:

```bash
go get github.com/your-repo/bataranetwork/sdk/go
```
*(Note: Replace with the actual repository path once published)*

## Usage

### Initializing the Client

```go
package main

import (
	"fmt"
	"bataranetwork/sdk/go" // Use the correct import path
)

func main() {
	client := batarasdk.NewBataraClient("http://localhost:3000")

	// Get node status
	status, err := client.GetStatus()
	if err != nil {
		fmt.Println("Error getting status:", err)
		return
	}
	fmt.Printf("Node Status: %+v\n", status)
}
```

### Creating a Wallet

The SDK provides cryptographic utilities to create a new wallet.

```go
wallet, err := batarasdk.CreateWallet()
if err != nil {
    // handle error
}

// Save to a file
err = wallet.SaveToFile("my_wallet.json")
if err != nil {
    // handle error
}

fmt.Println("Wallet Address:", wallet.PublicKey)
```

### Broadcasting a Transaction

Here's an example of how to create, sign, and broadcast a token transfer.

```go
// Load a wallet from a file
wallet, err := batarasdk.LoadWalletFromFile("my_wallet.json")
if err != nil {
    // handle error
}

// Get the next nonce for the account
account, err := client.GetAccount(wallet.PublicKey)
if err != nil {
    // handle error
}

// Create the transaction data
txData := batarasdk.TransferTransactionData{
    To:     "recipient-public-key-pem",
    Amount: 100,
}

// Create and sign the transaction
signedTx, err := batarasdk.CreateSignedTransaction(wallet, batarasdk.TransactionTypeTransfer, txData, account.Nonce, 5)
if err != nil {
    // handle error
}

// Broadcast it using the high-level method
result, err := client.TransferTokens(signedTx)
if err != nil {
    // handle error
}

fmt.Printf("Transaction broadcasted: %+v\n", result)
```

### Calling a Smart Contract

```go
// Load wallet and get nonce...
wallet, _ := batarasdk.LoadWalletFromFile("my_wallet.json")
account, _ := client.GetAccount(wallet.PublicKey)

// Create transaction data for contract call
callData := batarasdk.ContractCallTransactionData{
    ContractID: "contract-id-hash",
    Function:   "setState",
    Args:       []interface{}{"message", "hello from Go!"},
}

// Sign and broadcast
signedTx, _ := batarasdk.CreateSignedTransaction(wallet, batarasdk.TransactionTypeContractCall, callData, account.Nonce, 10)
result, _ := client.CallContract(signedTx) // Using the high-level method
fmt.Printf("Contract call result: %+v\n", result)
```

---

## Go CLI

A command-line tool is included in this SDK to provide a simple way to interact with the blockchain from your terminal.

### Building the CLI

From the `sdk/go` directory, run the following command:

```bash
go build -o batara-cli-go ./cmd/batara-cli-go
```

This will create an executable file named `batara-cli-go` in the current directory (`sdk/go`).

### CLI Usage

You can now use the compiled binary to perform actions.

#### Deploy a WASM Contract

This command will deploy a smart contract. You must provide a wallet, the path to the compiled `.wasm` file, and your account's next nonce. You can optionally provide an initial state.

```bash
# Deploy a simple contract
./batara-cli-go deploy-wasm --wallet ./my_wallet.json --code ./contract.wasm --nonce 0

# Deploy a contract with an initial state
./batara-cli-go deploy-wasm \
  --wallet ./my_wallet.json \
  --code ./contract.wasm \
  --nonce 1 \
  --init-state '{"owner": "your-public-key", "count": 42}'
```

#### Call a Contract Function

This command will call a function on a deployed smart contract. You need to provide the contract's ID (which is the hash of the deployment transaction), the function name, and any arguments.

```bash
# Call a function with no arguments
./batara-cli-go call-contract \
  --wallet ./my_wallet.json \
  --contract-id "transaction-hash-of-deployment" \
  --function "getState" \
  --nonce 2

# Call a function with arguments
# Arguments must be a valid JSON array string.
./batara-cli-go call-contract \
  --wallet ./my_wallet.json \
  --contract-id "transaction-hash-of-deployment" \
  --function "setState" \
  --nonce 3 \
  --args '["message", "hello from the CLI!"]'
```