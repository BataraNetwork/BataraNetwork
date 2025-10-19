# BataraNetwork - AI-Powered Modular Blockchain Ecosystem

Welcome to Bataranetwork, a distributed, modular blockchain platform designed for scalability, flexibility, and rapid development. This repository contains the core blockchain node, a rich block explorer, developer SDKs, and a powerful, enterprise-grade **AI-Powered DevOps Dashboard** for comprehensive management and monitoring.

---

## ✨ The Bataranetwork DevOps Dashboard

The centerpiece of this project is a sophisticated web-based dashboard that provides a complete suite of tools for managing a Bataranetwork node. It transforms complex DevOps tasks into a streamlined, intelligent, and visual experience.

*(Imagine a screenshot of the dashboard here)*

### 🚀 Features

-   **🤖 AI-Powered Configuration Generation:** Instantly generate production-ready files (`Dockerfile`, `Kubernetes YAML`, `Helm Charts`, `GitHub Actions`, etc.) by selecting a type and providing plain English instructions.
-   **📈 Real-Time Node Monitoring:** View live metrics for block height, transactions, CPU, memory, and network I/O through visually rich charts and graphs.
-   **🧠 Intelligent Alerting & Remediation:** A full-featured alert manager that not only displays critical and warning alerts but also uses AI to generate step-by-step remediation plans for active issues.
-   **🚢 CI/CD Pipeline Simulation:** Visualize a complete, multi-stage deployment pipeline, including build, test, manual approval, and production deployment stages, with a full history of past runs.
-   **🛡️ AI Security Scanner:** Upload or paste any configuration file to have an AI agent audit it for security vulnerabilities, misconfigurations, and deviations from best practices.
-   **📜 Live Log Streaming & AI Analysis:** A real-time log viewer with powerful filtering and search. Use the integrated AI agent to analyze thousands of log lines and generate a concise summary of patterns, errors, and potential root causes.

### 💻 Technology Stack

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Data Visualization:** Recharts
-   **Backend API:** Serverless Functions (Vercel)
-   **Artificial Intelligence:** Google Gemini API

---

## 🏗️ Broader Project Overview

-   **Core Node**: A high-performance blockchain node built with Node.js and TypeScript, featuring pluggable consensus and LevelDB storage.
-   **Block Explorer**: A full-featured block explorer with a React frontend and an Express backend.
-   **SDKs**: Developer-friendly SDKs in both JavaScript and Python for seamless interaction with the network.
-   **Infrastructure**: Production-ready infrastructure defined in Terraform and Kubernetes, with Helm charts for easy deployment.
-   **CI/CD**: Comprehensive CI/CD pipelines for both GitHub Actions and GitLab CI to ensure code quality and automate deployments.

## 🧩 Monorepo Structure

```
/
├── api/                # Serverless functions for the dashboard's AI features
├── src/                # DevOps Dashboard frontend source (React)
├── core/               # Core blockchain logic (Node.js)
├── explorer/           # Block explorer (React frontend, Express backend)
├── infra/              # Infrastructure as Code (K8s, Terraform, Helm)
├── sdk/                # SDKs for interacting with the network
├── ... and other configuration files
```

## 🚀 Getting Started

### Prerequisites

-   Node.js v20+
-   `pnpm` (recommended for monorepo management)
-   Docker & Docker Compose

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd BataraNetwork
    ```

2.  **Install dependencies using pnpm from the root:**
    ```bash
    pnpm install
    ```

### 1. Running the DevOps Dashboard in Isolation (Recommended for Frontend Dev)

This is the fastest way to work on the dashboard UI.

1.  **Set up your environment variables.** Create a `.env` file in the root of the project and add your Gemini API key:
    ```
    API_KEY="YOUR_GEMINI_API_KEY"
    ```

2.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    This will start the Vite development server for the dashboard, typically on `http://localhost:5173`.

### 2. Running the Full Local Network

This command starts the entire Bataranetwork ecosystem, including the blockchain node, the explorer, and other services using Docker Compose.

```bash
docker-compose up --build
```

## 🤝 Contributing

Contributions are welcome! Please see the detailed development guide in `docs/contributing.md` for instructions on how to contribute, run tests, and manage the infrastructure.

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
