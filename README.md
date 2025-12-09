# Finance Tracker

A full-stack personal finance management web application for tracking income, expenses, and savings goals with real-time analytics and visualizations.

## Features

- **Dashboard** - Overview of finances with summary cards, monthly trend charts, and spending breakdowns
- **Transaction Management** - Track income and expenses with categories, descriptions, and dates
- **Savings Goals** - Set financial goals with progress tracking, deadlines, and contributions
- **Analytics** - Visualize spending patterns with interactive charts (area charts, pie charts)
- **Responsive Design** - Clean, modern UI that works across devices

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite (build tooling)
- React Router (navigation)
- Recharts (data visualization)
- CSS Modules (styling)

### Backend
- Express.js with TypeScript
- SQLite with better-sqlite3
- RESTful API design

### Infrastructure
- Docker with multi-stage builds
- Docker Compose for local development
- Kubernetes with Kustomize
- Kong Gateway (using Gateway API)

## Project Structure

```
finance-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, ErrorBoundary
│   │   ├── hooks/          # useApi custom hook
│   │   ├── pages/          # Dashboard, Transactions, Goals
│   │   └── types/          # TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.ts        # API routes
│   │   ├── db.ts           # SQLite setup
│   │   └── seed.ts         # Database seeding
│   └── Dockerfile
├── k8s/                    # Kubernetes manifests
│   ├── namespace.yaml
│   ├── pvc.yaml
│   ├── server-deployment.yaml
│   ├── client-deployment.yaml
│   ├── services.yaml
│   ├── gateway.yaml          # Gateway API resources (Gateway + HTTPRoutes)
│   └── kustomization.yaml
├── scripts/                # Build & deployment scripts
│   ├── build-images.sh
│   └── deploy.sh
└── docker-compose.yaml
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Docker and Docker Compose (for containerized development)
- kubectl and a Kubernetes cluster (for Kubernetes deployment)

### Local Development (without Docker)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both the client (http://localhost:5173) and server (http://localhost:3001) concurrently.

   Or run them separately:
   ```bash
   npm run dev:client    # Frontend on port 5173
   npm run dev:server    # Backend on port 3001
   ```

4. **Seed the database (optional)**
   ```bash
   cd server && npm run seed
   ```
   This populates the database with sample transactions and savings goals. Use `npm run seed:force` to clear existing data and reseed.

5. **Open the application**
   Navigate to http://localhost:5173 in your browser.

### Local Development with Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   The database is automatically seeded with sample data on first run.

2. **Access the application**
   - Frontend: http://localhost:8080
   - API: http://localhost:3001

3. **Stop the containers**
   ```bash
   docker-compose down
   ```

   To also remove the data volume:
   ```bash
   docker-compose down -v
   ```

## Deploying to Local Kubernetes with kind

This section provides step-by-step instructions for deploying the application to a local Kubernetes cluster using [kind](https://kind.sigs.k8s.io/) (Kubernetes IN Docker) with [Kong Gateway](https://docs.konghq.com/gateway/) using the Kubernetes Gateway API.

### Prerequisites

- Docker installed and running
- kubectl installed
- Helm installed ([installation guide](https://helm.sh/docs/intro/install/))
- kind installed ([installation guide](https://kind.sigs.k8s.io/docs/user/quick-start/#installation))

**Install kind (if not installed):**

```bash
# macOS with Homebrew
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Windows with Chocolatey
choco install kind
```

**Install Helm (if not installed):**

```bash
# macOS with Homebrew
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Windows with Chocolatey
choco install kubernetes-helm
```

### Step 1: Create a kind Cluster

Create a kind cluster with port mappings for Kong Gateway:

```bash
cat <<EOF | kind create cluster --name finance-tracker --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 31080
    hostPort: 80
    protocol: TCP
  - containerPort: 31443
    hostPort: 443
    protocol: TCP
EOF
```

Verify the cluster is running:
```bash
kubectl cluster-info --context kind-finance-tracker
```

### Step 2: Install Gateway API CRDs

Install the Kubernetes Gateway API Custom Resource Definitions:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml
```

Verify the CRDs are installed:
```bash
kubectl get crd | grep gateway
```

Expected output:
```
gatewayclasses.gateway.networking.k8s.io
gateways.gateway.networking.k8s.io
httproutes.gateway.networking.k8s.io
referencegrants.gateway.networking.k8s.io
```

### Step 3: Install Kong Gateway with Helm

Add the Kong Helm repository:
```bash
helm repo add kong https://charts.konghq.com
helm repo update
```

Install Kong Ingress Controller with Gateway API support:
```bash
helm install kong kong/ingress -n kong --create-namespace \
  --set gateway.proxy.type=NodePort \
  --set gateway.proxy.http.nodePort=31080 \
  --set gateway.proxy.tls.nodePort=31443
```

Wait for Kong to be ready:
```bash
kubectl wait --namespace kong \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=app \
  --timeout=120s
```

Verify Kong is running:
```bash
kubectl -n kong get pods
```

Verify the GatewayClass is available:
```bash
kubectl get gatewayclass
```

Expected output:
```
NAME   CONTROLLER                          ACCEPTED   AGE
kong   konghq.com/kic-gateway-controller   True       1m
```

### Step 4: Build Docker Images

Build the Docker images locally:

```bash
./scripts/build-images.sh
```

This creates:
- `finance-tracker-server:latest`
- `finance-tracker-client:latest`

### Step 5: Load Images into kind

Load the images into the kind cluster:

```bash
kind load docker-image finance-tracker-server:latest --name finance-tracker
kind load docker-image finance-tracker-client:latest --name finance-tracker
```

Verify images are loaded:
```bash
docker exec -it finance-tracker-control-plane crictl images | grep finance-tracker
```

### Step 6: Deploy the Application

Use the deployment script:
```bash
./scripts/deploy.sh
```

Or apply manually with kustomize:
```bash
kubectl apply -k k8s/
```

This creates:
- `finance-tracker` namespace
- PersistentVolumeClaim for SQLite data
- Server deployment (1 replica) - database is automatically seeded on first run
- Client deployment (2 replicas)
- ClusterIP services
- Gateway and HTTPRoute resources

### Step 7: Verify Deployment

Check that all pods are running:
```bash
kubectl -n finance-tracker get pods
```

Expected output:
```
NAME                                       READY   STATUS    RESTARTS   AGE
finance-tracker-client-xxxxx-xxxxx         1/1     Running   0          1m
finance-tracker-client-xxxxx-xxxxx         1/1     Running   0          1m
finance-tracker-server-xxxxx-xxxxx         1/1     Running   0          1m
```

Check services:
```bash
kubectl -n finance-tracker get svc
```

Check Gateway status:
```bash
kubectl -n finance-tracker get gateway
```

Expected output:
```
NAME                        CLASS   ADDRESS   PROGRAMMED   AGE
finance-tracker-gateway     kong              True         1m
```

Check HTTPRoutes:
```bash
kubectl -n finance-tracker get httproute
```

Expected output:
```
NAME                       HOSTNAMES                    AGE
finance-tracker-api        ["finance-tracker.local"]    1m
finance-tracker-client     ["finance-tracker.local"]    1m
```

### Step 8: Access the Application

**Option A: Using Gateway (recommended)**

1. Add the hostname to your `/etc/hosts` file:
   ```bash
   echo "127.0.0.1 finance-tracker.local" | sudo tee -a /etc/hosts
   ```

2. Access the application at http://finance-tracker.local

**Option B: Using Port Forward**

If you prefer not to modify `/etc/hosts`:

```bash
kubectl -n finance-tracker port-forward svc/finance-tracker-client 8080:80
```

Access the application at http://localhost:8080

### Quick Start Script

For convenience, here's a complete script to set everything up:

```bash
#!/bin/bash
set -e

# Create kind cluster with Kong port mappings
cat <<EOF | kind create cluster --name finance-tracker --config=-
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 31080
    hostPort: 80
    protocol: TCP
  - containerPort: 31443
    hostPort: 443
    protocol: TCP
EOF

# Install Gateway API CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

# Install Kong with Helm
helm repo add kong https://charts.konghq.com
helm repo update
helm install kong kong/ingress -n kong --create-namespace \
  --set gateway.proxy.type=NodePort \
  --set gateway.proxy.http.nodePort=31080 \
  --set gateway.proxy.tls.nodePort=31443

# Wait for Kong to be ready
kubectl wait --namespace kong \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=app \
  --timeout=120s

# Build and load images
./scripts/build-images.sh
kind load docker-image finance-tracker-server:latest --name finance-tracker
kind load docker-image finance-tracker-client:latest --name finance-tracker

# Deploy application
./scripts/deploy.sh

echo ""
echo "Setup complete!"
echo "Add to /etc/hosts: 127.0.0.1 finance-tracker.local"
echo "Then open: http://finance-tracker.local"
```

### Cleanup

Delete the kind cluster when done:
```bash
kind delete cluster --name finance-tracker
```

Remove the `/etc/hosts` entry:
```bash
sudo sed -i '' '/finance-tracker.local/d' /etc/hosts  # macOS
sudo sed -i '/finance-tracker.local/d' /etc/hosts     # Linux
```

### Troubleshooting

**Check pod logs:**
```bash
kubectl -n finance-tracker logs -l app=finance-tracker-server
kubectl -n finance-tracker logs -l app=finance-tracker-client
```

**Describe pods for events:**
```bash
kubectl -n finance-tracker describe pod -l app=finance-tracker-server
```

**Check Gateway status:**
```bash
kubectl -n finance-tracker describe gateway finance-tracker-gateway
```

**Check HTTPRoute status:**
```bash
kubectl -n finance-tracker describe httproute finance-tracker-api
kubectl -n finance-tracker describe httproute finance-tracker-client
```

**Check Kong logs:**
```bash
kubectl -n kong logs -l app.kubernetes.io/component=app
```

**Restart deployments:**
```bash
kubectl -n finance-tracker rollout restart deployment/finance-tracker-server
kubectl -n finance-tracker rollout restart deployment/finance-tracker-client
```

**Rebuild and redeploy (after code changes):**
```bash
./scripts/build-images.sh
kind load docker-image finance-tracker-server:latest --name finance-tracker
kind load docker-image finance-tracker-client:latest --name finance-tracker
kubectl -n finance-tracker rollout restart deployment/finance-tracker-server
kubectl -n finance-tracker rollout restart deployment/finance-tracker-client
```

**Delete and redeploy:**
```bash
kubectl delete namespace finance-tracker
./scripts/deploy.sh
```

**Complete reset (delete cluster and start over):**
```bash
kind delete cluster --name finance-tracker
# Then run through steps 1-8 again
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions (supports filters) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/analytics/summary` | Get income/expense summary |
| GET | `/api/analytics/by-category` | Spending by category |
| GET | `/api/analytics/monthly` | Monthly trends |
| GET | `/api/categories` | Get category lists |

## Environment Variables

### Server
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_PATH` | `./finance.db` | SQLite database file path |
| `PORT` | `3001` | Server port (hardcoded) |
| `SEED_DB` | `true` (Docker) | Seed database with sample data on startup |

### Client (Docker)
| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `http://localhost:3001/api` | Backend API URL (injected at runtime) |

## Development Commands

```bash
# Development
npm run dev              # Start both client and server
npm run dev:client       # Start client only (port 5173)
npm run dev:server       # Start server only (port 3001)

# Build
npm run build            # Build client for production
cd server && npx tsc     # Type-check server

# Lint
cd client && npm run lint

# Database Seeding
cd server && npm run seed        # Seed database (skips if data exists)
cd server && npm run seed:force  # Clear and reseed database

# Docker
docker-compose up --build
./scripts/build-images.sh

# Kubernetes
kubectl apply -k k8s/
./scripts/deploy.sh
kubectl -n finance-tracker port-forward svc/finance-tracker-client 8080:80
```

## Architecture Notes

- **SQLite Limitation**: The server runs as a single replica in Kubernetes because SQLite doesn't support concurrent writes from multiple processes. For production with horizontal scaling, consider migrating to PostgreSQL or MySQL.
- **Client Scaling**: The frontend can scale horizontally since it's stateless (served by NGINX).
- **Data Persistence**: SQLite data is stored on a PersistentVolumeClaim in Kubernetes to survive pod restarts.

## License

MIT
