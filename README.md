
#  BataraNetwork - Full Modular Blockchain Ecosystem

BataraNetwork is a distributed, modular blockchain platform designed for scalability, flexibility, and rapid development. It includes a core blockchain node, AI-powered DevOps agents, a rich block explorer, and a complete suite of infrastructure automation tools.

## 🏗️ Project Overview

- **Core Node**: A high-performance blockchain node built with Node.js and TypeScript, featuring pluggable consensus and LevelDB storage.
- **AI Agents**: Python-based agents for security auditing, performance profiling, and deployment automation.
- **Explorer**: A full-featured block explorer with a React frontend and an Express backend.
- **SDKs**: Developer-friendly SDKs in both JavaScript and Python for seamless interaction with the network.
- **Infrastructure**: Production-ready infrastructure defined in Terraform and Kubernetes, with Helm charts for easy deployment.
- **CI/CD**: Comprehensive CI/CD pipelines for both GitHub Actions and GitLab CI to ensure code quality and automate deployments.

## 🧩 Monorepo Structure

```
/
├── agents/             # Python AI/DevOps agents (FastAPI)
├── ci/                 # CI/CD pipelines (GitHub Actions, GitLab CI)
├── core/               # Core blockchain logic
│   ├── cli/            # Command-line interface
│   ├── node/           # The main blockchain node (Node.js)
│   └── proto/          # gRPC protobuf definitions
├── docs/               # Project documentation
├── explorer/           # Block explorer (React frontend, Express backend)
├── infra/              # Infrastructure as Code (K8s, Terraform, Helm)
├── sdk/                # SDKs for interacting with the network
│   ├── js/             # TypeScript SDK
│   └── python/         # Python SDK
├── scripts/            # Utility and deployment scripts
├── .github/            # Issue templates, PR templates, etc.
└── package.json        # Root package for monorepo management
```

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- Python v3.11+
- Docker & Docker Compose
- Terraform v1.5+
- Helm v3+
- `pnpm` (recommended for monorepo management)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd BataraNetwork
    ```

2.  **Install dependencies using pnpm:**
    ```bash
    pnpm install
    ```

### Running a Local Network

To start a local development instance of the BataraNetwork node and its dependencies:

```bash
./scripts/localnet.sh
```

This will use Docker Compose to spin up the core node, the explorer backend, and monitoring services.

## ⚙️ Development Guide

Please see the detailed development guide in `docs/development-guide.md` for instructions on how to contribute, run tests, and manage the infrastructure.
