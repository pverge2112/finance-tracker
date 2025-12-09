#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Deploying Finance Tracker to Kubernetes..."

# Apply all manifests using kustomize
kubectl apply -k "${PROJECT_ROOT}/k8s"

echo ""
echo "Waiting for deployments to be ready..."
kubectl -n finance-tracker rollout status deployment/finance-tracker-server --timeout=120s
kubectl -n finance-tracker rollout status deployment/finance-tracker-client --timeout=120s

echo ""
echo "Deployment complete!"
echo ""
echo "To access the application:"
echo "  1. Add to /etc/hosts: 127.0.0.1 finance-tracker.local"
echo "  2. Or use port-forward: kubectl -n finance-tracker port-forward svc/finance-tracker-client 8080:80"
echo "     Then open http://localhost:8080"
