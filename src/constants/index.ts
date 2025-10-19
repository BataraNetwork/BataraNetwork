
// FIX: Replaced raw YAML content with exported TypeScript constants to make it a valid module.

export const DOCKERFILE_CONTENT = `
# ---- Builder Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Copy proto files
RUN mkdir -p dist/proto && cp -r src/proto/*.proto dist/proto/

# ---- Runtime Stage ----
FROM node:20-alpine

WORKDIR /app

# Only copy necessary production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .

# Expose ports
EXPOSE 3000
EXPOSE 50051
EXPOSE 9100

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

# Entrypoint
CMD ["node", "dist/index.js"]
`;

export const GITHUB_ACTIONS_CONTENT = `
name: Bataranetwork CI/CD

on:
  push:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm install

    - name: Lint code
      run: npm run lint

    - name: Build project
      run: npm run build
    
    - name: Run tests
      run: npm test

  push-to-registry:
    needs: build-and-test
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Log in to the Container registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest
`;

export const DOCKER_COMPOSE_CONTENT = `
version: '3.8'

services:
  velorachain-node:
    image: ghcr.io/your-repo/bataranetwork:latest
    container_name: bataranetwork_node
    restart: always
    ports:
      - "3000:3000"    # HTTP RPC
      - "50051:50051"  # gRPC
      - "9100:9100"    # Prometheus Metrics
    volumes:
      - veloradata:/app/data # Persistent LevelDB storage
    environment:
      - NODE_ENV=production
      # Add other config via environment variables

  prometheus:
    image: prom/prometheus:v2.37.0
    container_name: prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

volumes:
  veloradata:
`;

export const KUBERNETES_CONTENT = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: bataranetwork-config
data:
  config.json: |
    {
      "env": "production",
      "http_port": 3000,
      "grpc_port": 50051,
      "metrics_port": 9100
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bataranetwork-node
spec:
  replicas: 1
  selector:
    matchLabels:
      app: bataranetwork
  template:
    metadata:
      labels:
        app: bataranetwork
    spec:
      containers:
      - name: bataranetwork-node
        image: ghcr.io/your-repo/bataranetwork:latest
        ports:
        - containerPort: 3000
          name: http-rpc
        - containerPort: 50051
          name: grpc
        - containerPort: 9100
          name: metrics
        # Resource requests and limits for the node.
        # Adjust these values based on your cluster's capacity and node performance.
        resources:
          requests:
            cpu: "250m" # 0.25 of a CPU core
            memory: "512Mi" # 512 Mebibytes of memory
          limits:
            cpu: "500m" # 0.5 of a CPU core
            memory: "1Gi"  # 1 Gibibyte of memory
        # Liveness probe to check if the node is running.
        # If this fails, Kubernetes will restart the pod.
        livenessProbe:
          httpGet:
            path: /health
            port: http-rpc
          initialDelaySeconds: 15
          periodSeconds: 20
          timeoutSeconds: 5
          failureThreshold: 3
        # Readiness probe to check if the node is ready to accept traffic.
        # If this fails, the pod is removed from the service endpoint.
        readinessProbe:
          httpGet:
            path: /health
            port: http-rpc
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        volumeMounts:
        - name: data-volume
          mountPath: /app/data
        - name: config-volume
          mountPath: /app/config
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: bataranetwork-pvc
      - name: config-volume
        configMap:
          name: bataranetwork-config
---
apiVersion: v1
kind: Service
metadata:
  name: bataranetwork-service
spec:
  selector:
    app: bataranetwork
  ports:
  - name: http
    protocol: TCP
    port: 3000
    targetPort: 3000
  - name: grpc
    protocol: TCP
    port: 50051
    targetPort: 50051
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: bataranetwork-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
`;

export const HELM_CHART_CONTENT = `
# FILENAME: Chart.yaml
apiVersion: v2
name: bataranetwork
description: A Helm chart for deploying the Bataranetwork blockchain node.
type: application
version: 0.1.0
appVersion: "1.0.0"

---
# FILENAME: values.yaml
replicaCount: 1

image:
  repository: bataranetwork-org/bataranetwork
  pullPolicy: IfNotPresent
  tag: "latest"

service:
  type: ClusterIP
  httpPort: 3000
  grpcPort: 50051

config:
  # -- Raw JSON configuration for the node.
  # It will be mounted as a file at /app/config/config.json
  json: |-
    {
      "env": "production",
      "http_port": 3000,
      "grpc_port": 50051,
      "metrics_port": 9100
    }

persistence:
  enabled: true
  size: 10Gi
  storageClassName: ""

resources:
  # We recommend not specifying default resources and leaving this as a conscious
  # choice for the user. This also increases chances charts run on environments with little
  # resources, such as Minikube. If you do specify resources, uncomment the following lines.
  # limits:
  #   cpu: 500m
  #   memory: 1Gi
  # requests:
  #   cpu: 250m
  #   memory: 512Mi

ingress:
  enabled: false
  className: ""
  annotations: {}
  # kubernetes.io/ingress.class: nginx
  # kubernetes.io/tls-acme: "true"
  hosts:
    - host: node.bataranetwork.local
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls: []
  #  - secretName: bataranetwork-tls
  #    hosts:
  #      - node.bataranetwork.local

networkPolicy:
  enabled: true

# Probes configuration
livenessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 15
  periodSeconds: 20
  timeoutSeconds: 5
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
---
# FILENAME: templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "bataranetwork.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "bataranetwork.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{/*
Common labels
*/}}
{{- define "bataranetwork.labels" -}}
helm.sh/chart: {{ include "bataranetwork.chart" . }}
{{ include "bataranetwork.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Selector labels
*/}}
{{- define "bataranetwork.selectorLabels" -}}
app.kubernetes.io/name: {{ include "bataranetwork.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

---
# FILENAME: templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "bataranetwork.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "bataranetwork.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.service.httpPort }}
              protocol: TCP
            - name: grpc
              containerPort: {{ .Values.service.grpcPort }}
              protocol: TCP
          livenessProbe:
            {{- toYaml .Values.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.readinessProbe | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: data
              mountPath: /app/data
            - name: config
              mountPath: /app/config
              readOnly: true
      volumes:
        - name: data
        {{- if .Values.persistence.enabled }}
          persistentVolumeClaim:
            claimName: {{ include "bataranetwork.name" . }}
        {{- else }}
          emptyDir: {}
        {{- end }}
        - name: config
          configMap:
            name: {{ include "bataranetwork.name" . }}

---
# FILENAME: templates/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
    - port: {{ .Values.service.httpPort }}
      targetPort: http
      protocol: TCP
      name: http
    - port: {{ .Values.service.grpcPort }}
      targetPort: grpc
      protocol: TCP
      name: grpc
  selector:
    {{- include "bataranetwork.selectorLabels" . | nindent 4 }}

---
# FILENAME: templates/pvc.yaml
{{- if .Values.persistence.enabled }}
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ .Values.persistence.size }}
  {{- if .Values.persistence.storageClassName }}
  storageClassName: {{ .Values.persistence.storageClassName }}
  {{- end }}
{{- end }}

---
# FILENAME: templates/configmap.yaml
# ConfigMap resource to manage the node's configuration.
# This allows separating configuration from the container image, making it easier
# to manage and update settings without rebuilding the image.
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
data:
  config.json: |-
{{ .Values.config.json | indent 4 }}

---
# FILENAME: templates/ingress.yaml
{{- if .Values.ingress.enabled -}}
# Ingress resource to expose the HTTP service outside the cluster.
# It requires an Ingress Controller (like NGINX or Traefik) to be running in the cluster.
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
  {{- with .Values.ingress.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
spec:
{{- if .Values.ingress.className }}
  ingressClassName: {{ .Values.ingress.className }}
{{- end }}
{{- if .Values.ingress.tls }}
  tls:
  {{- range .Values.ingress.tls }}
    - hosts:
      {{- range .hosts }}
        - {{ . | quote }}
      {{- end }}
      secretName: {{ .secretName }}
  {{- end }}
{{- end }}
  rules:
  {{- range .Values.ingress.hosts }}
    - host: {{ .host | quote }}
      http:
        paths:
        {{- range .paths }}
          - path: {{ .path }}
            pathType: {{ .pathType }}
            backend:
              service:
                name: {{ include "bataranetwork.name" $ }}
                port:
                  name: http
        {{- end }}
  {{- end }}
{{- end }}

---
# FILENAME: templates/networkpolicy.yaml
{{- if .Values.networkPolicy.enabled -}}
# NetworkPolicy to restrict ingress traffic to the node pods.
# By default, it denies all ingress traffic and then explicitly allows
# connections on the HTTP and gRPC ports from any pod within the same namespace.
# This helps secure the node by preventing unwanted access from other namespaces.
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: {{ include "bataranetwork.name" . }}
  labels:
    {{- include "bataranetwork.labels" . | nindent 4 }}
spec:
  podSelector:
    matchLabels:
      {{- include "bataranetwork.selectorLabels" . | nindent 6 }}
  policyTypes:
    - Ingress
  ingress:
    # Allow ingress traffic from any pod within the same namespace.
    # This is useful for allowing services like Prometheus or other microservices
    # within the same application stack to communicate with the node.
    - from:
      - podSelector: {} # An empty podSelector selects all pods in the namespace.
      ports:
        - protocol: TCP
          port: {{ .Values.service.httpPort }}
        - protocol: TCP
          port: {{ .Values.service.grpcPort }}
{{- end }}
