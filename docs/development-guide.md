# Bataranetwork Development Guide

This guide provides instructions for setting up your development environment and contributing to the Bataranetwork project.

## Prerequisites

- Node.js (v20+)
- Docker and Docker Compose
- An understanding of TypeScript and React

## Getting Started

1.  **Clone the repository:**
    `git clone <repository-url>`
2.  **Install dependencies:**
    `npm install`
3.  **Run the development server:**
    `npm run dev`

## Environment Variable Configuration

Environment variables are crucial for configuring the application without hardcoding values, especially for sensitive data like API keys.

### Gemini API Key (`API_KEY`)

The DevOps Dashboard uses the Google Gemini API to generate configuration files. To enable this functionality, you must provide a valid API key.

**This is a mandatory step for using the AI generation features.** The application will display a warning and disable AI-powered buttons if the `API_KEY` is not set.

### How to Set the API_KEY

#### 1. Local Development (`.env` file)

For local development, the easiest method is to use a `.env` file at the root of the project.

1.  Create a file named `.env` in the project's root directory.
2.  Add the following line to the file, replacing `YOUR_GEMINI_API_KEY` with your actual key:

    ```
    API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  Ensure that `.env` is listed in your `.gitignore` file to prevent the key from being committed to version control.

#### 2. Docker & Docker Compose

When running the application inside a Docker container, you can pass the environment variable through your `docker-compose.yml` file or via the command line.

**Example `docker-compose.yml`:**

```yaml
services:
  bataranetwork-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - API_KEY=${API_KEY} # Reads from a .env file in the same directory
```

#### 3. Kubernetes Deployment

In a production environment like Kubernetes, you should use **Secrets** to manage sensitive data like API keys.

1.  **Create a Kubernetes Secret:**

    Create a file `gemini-secret.yml`:
    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: gemini-api-key-secret
    type: Opaque
    stringData:
      API_KEY: "YOUR_GEMINI_API_KEY"
    ```

    Apply it to your cluster: `kubectl apply -f gemini-secret.yml`

2.  **Reference the Secret in your Deployment:**

    Update your Deployment manifest to mount the secret as an environment variable.

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: bataranetwork-dashboard
    spec:
      template:
        spec:
          containers:
          - name: dashboard
            image: your-dashboard-image
            envFrom:
              - secretRef:
                  name: gemini-api-key-secret
    ```