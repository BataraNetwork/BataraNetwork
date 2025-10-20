# Bataranetwork Deployment Guide

This guide provides instructions for deploying the Bataranetwork node in various environments, from local development with Docker to production-ready setups with Kubernetes and Helm.

## Method 1: Docker Compose (Recommended for Local Development)

Using Docker Compose is the quickest way to get the entire Bataranetwork ecosystem (node, explorer, Prometheus) running locally.

### Prerequisites
- Docker
- Docker Compose

### Instructions

1.  **Navigate to the project root.**

2.  **Build and run all services in detached mode:**
    ```sh
    docker-compose up --build -d
    ```

3.  **Check the status of the containers:**
    ```sh
    docker-compose ps
    ```
    You should see `bataranetwork_node`, `explorer_backend`, `explorer_frontend`, and `prometheus` running.

4.  **Access the services:**
    -   **Node HTTP API**: `http://localhost:3000`
    -   **Explorer Backend API**: `http://localhost:4000`
    -   **Explorer Frontend**: `http://localhost:5173`
    -   **Prometheus**: `http://localhost:9090`

5.  **To stop the services:**
    ```sh
    docker-compose down
    ```

## Method 2: Kubernetes (Using Raw Manifests)

The `explorer/frontend/infra/kubernetes` directory contains basic manifests for deploying the node to a Kubernetes cluster.

### Prerequisites
- A running Kubernetes cluster (e.g., Minikube, kind, or a cloud provider's cluster)
- `kubectl` configured to connect to your cluster

### Instructions

1.  **Create the Namespace**: It's best practice to deploy the application into its own namespace.
    ```sh
    kubectl apply -f explorer/frontend/infra/kubernetes/namespace.yaml
    ```

2.  **Create the Persistent Volume Claim (PVC)**: This will provide stable storage for the blockchain data.
    ```sh
    kubectl apply -f explorer/frontend/infra/kubernetes/pvc.yaml
    ```

3.  **Deploy the Node**: Apply the deployment and service manifests.
    ```sh
    # This deploys the node itself
    kubectl apply -f explorer/frontend/infra/kubernetes/deployment.yaml

    # This creates a ClusterIP service to expose the node within the cluster
    kubectl apply -f explorer/frontend/infra/kubernetes/service.yaml
    ```
    **Note**: You must have a container image for `bataranetwork-node` pushed to a registry that your cluster can access (e.g., GHCR, Docker Hub). Update the `image` field in `deployment.yaml` accordingly.

4.  **Access the service**: To access the node from your local machine, you can use port-forwarding:
    ```sh
    kubectl port-forward svc/bataranetwork-service -n bataranetwork 3000:3000
    ```
    You can now access the API at `http://localhost:3000`.

## Method 3: Kubernetes (Using Helm)

The `explorer/frontend/infra/helm/bataranetwork-node` directory contains a Helm chart for a more configurable and manageable deployment.

### Prerequisites
- A running Kubernetes cluster
- `kubectl` configured
- Helm v3 installed

### Instructions

1.  **Navigate to the chart directory:**
    ```sh
    cd explorer/frontend/infra/helm/bataranetwork-node
    ```

2.  **Install the Helm chart**: This command will install the chart into the `bataranetwork` namespace (creating it if it doesn't exist) with the release name `my-node`.
    ```sh
    helm install my-node . --namespace bataranetwork --create-namespace
    ```

3.  **Customize your deployment**: You can override the default settings in `values.yaml` by creating your own values file or using the `--set` flag.

    For example, to deploy with 3 replicas:
    ```sh
    helm install my-node . --namespace bataranetwork --set replicaCount=3
    ```

4.  **Check the deployment status**:
    ```sh
    helm status my-node -n bataranetwork
    ```

5.  **Upgrade the deployment**: After making changes to the chart or your values, upgrade the release:
    ```sh
    helm upgrade my-node . -n bataranetwork
    ```

6.  **Uninstall the deployment**:
    ```sh
    helm uninstall my-node -n bataranetwork
    ```
