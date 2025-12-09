# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance tracker web application with React frontend and Express backend using SQLite for persistence.

## Commands

### Development
```bash
npm run dev              # Start both client and server concurrently
npm run dev:client       # Start client only (Vite on port 5173)
npm run dev:server       # Start server only (Express on port 3001)
```

### Build
```bash
npm run build                           # Build client for production
cd server && npx tsc                    # Type-check server
cd client && npm run build              # Build client only
```

### Lint
```bash
cd client && npm run lint               # Lint client code
```

### Database Seeding
```bash
cd server && npm run seed               # Seed database (skips if data exists)
cd server && npm run seed:force         # Clear and reseed database
```

### Docker
```bash
docker-compose up --build               # Run locally with Docker
./scripts/build-images.sh               # Build Docker images
REGISTRY=your-registry TAG=v1 ./scripts/build-images.sh  # With registry
```

### Kubernetes
```bash
kubectl apply -k k8s/                   # Deploy to cluster
./scripts/deploy.sh                     # Deploy and wait for rollout
kubectl -n finance-tracker port-forward svc/finance-tracker-client 8080:80
```

## Architecture

### Monorepo Structure
- `client/` - React + TypeScript + Vite frontend
- `server/` - Express + TypeScript backend with SQLite (better-sqlite3)
- `k8s/` - Kubernetes manifests with Kustomize
- `scripts/` - Build and deployment scripts

### Frontend (client/)
- **Routing**: React Router with Layout component wrapping pages
- **State**: Local state with `useApi` custom hook for data fetching
- **Styling**: CSS modules per component, global styles in `index.css`
- **Charts**: Recharts for dashboard visualizations
- **Pages**: Dashboard, Transactions, Goals (in `src/pages/`)
- **Error Handling**: ErrorBoundary component wraps all pages that make API calls

### Backend (server/)
- **Database**: SQLite with `better-sqlite3`, schema auto-created on startup
- **Seeding**: `src/seed.ts` populates sample transactions and goals; runs automatically in Docker/K8s when `SEED_DB=true` or database doesn't exist
- **API Routes**: RESTful endpoints under `/api/`
  - `/api/transactions` - CRUD for income/expenses
  - `/api/goals` - CRUD for savings goals
  - `/api/analytics/*` - Summary, category breakdown, monthly trends
  - `/api/categories` - Static category lists
- **DB Path**: Configurable via `DB_PATH` env var (defaults to `server/finance.db`)
- **Server Port**: Runs on port 3001 (hardcoded in `src/index.ts`)

### API Communication
- Frontend API base URL hardcoded in `client/src/hooks/useApi.ts`
- Docker entrypoint script (`client/docker-entrypoint.sh`) replaces URL at runtime via `API_URL` env var

### Kubernetes Deployment
- Uses Kong Gateway with Kubernetes Gateway API (not Ingress)
- Gateway and HTTPRoute resources in `k8s/gateway.yaml` route traffic:
  - `/api/*` → finance-tracker-server:3001
  - `/` → finance-tracker-client:80
- PersistentVolumeClaim for SQLite data persistence
- Server runs single replica (SQLite limitation), client can scale horizontally
- Requires Gateway API CRDs and Kong Ingress Controller installed via Helm

## Code Conventions

### Type Imports
Use `import type` for TypeScript type-only imports (verbatimModuleSyntax enabled):
```typescript
import type { Transaction, Goal } from '../types';
```

### Error Boundaries
Always wrap components that make API calls with ErrorBoundary:
```tsx
<ErrorBoundary>
  <ComponentWithApiCalls />
</ErrorBoundary>
```
