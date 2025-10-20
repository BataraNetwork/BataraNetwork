# Contributing to Bataranetwork

First off, thank you for considering contributing to Bataranetwork! We welcome contributions from the community to help us build a robust and feature-rich platform.

This document provides guidelines for contributing to the project. Please feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please ensure the bug has not already been reported by searching on GitHub under [Issues](https://github.com/your-org/bataranetwork/issues). If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/your-org/bataranetwork/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample or an executable test case** demonstrating the expected behavior that is not occurring.

### Suggesting Enhancements

If you have an idea for an enhancement, please open an issue to discuss it. This allows us to coordinate efforts and ensure the feature aligns with the project's goals.

### Pull Requests

We welcome pull requests for bug fixes, new features, and documentation improvements.

## Development Setup

The Bataranetwork project is a `pnpm` monorepo.

### Prerequisites
- Node.js (v20+)
- pnpm (`npm install -g pnpm`)
- Docker and Docker Compose (for running the full ecosystem)

### Installation

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```sh
    git clone https://github.com/your-username/bataranetwork.git
    cd bataranetwork
    ```
3.  **Install all dependencies** for all packages in the monorepo using `pnpm`:
    ```sh
    pnpm install
    ```

### Running the Full Development Environment

To run the blockchain node, the block explorer, and the DevOps dashboard simultaneously with hot-reloading:

```sh
pnpm dev
```
This command uses the `scripts/dev.mjs` script to concurrently run the `dev` script for each service.

### Running Tests

You can run the entire test suite for all packages from the root directory:
```sh
pnpm test
```

To run tests for a specific package (e.g., the core node):
```sh
pnpm --filter bataranetwork-node test
```

## Pull Request Process

1.  **Create a branch** for your changes: `git checkout -b feature/my-new-feature`.
2.  **Make your changes**. Ensure you adhere to the coding style and add/update tests for any new functionality.
3.  **Ensure all tests pass** by running `pnpm test`.
4.  **Commit your changes** with a clear and descriptive commit message.
5.  **Push your branch** to your fork: `git push origin feature/my-new-feature`.
6.  **Create a pull request** to the `main` branch of the main Bataranetwork repository.
7.  Provide a clear and descriptive title and description for your pull request, referencing any related issues (e.g., `Fixes #123`).
8.  A core team member will review your PR. Be prepared to address any feedback.

Thank you for your contribution!
