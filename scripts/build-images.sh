#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default registry (can be overridden)
REGISTRY=${REGISTRY:-""}
TAG=${TAG:-"latest"}

# Build prefix if registry is set
PREFIX=""
if [ -n "$REGISTRY" ]; then
    PREFIX="${REGISTRY}/"
fi

echo "Building Finance Tracker Docker images..."

# Build server
echo "Building server image..."
docker build -t "${PREFIX}finance-tracker-server:${TAG}" "${PROJECT_ROOT}/server"

# Build client
echo "Building client image..."
docker build -t "${PREFIX}finance-tracker-client:${TAG}" "${PROJECT_ROOT}/client"

echo ""
echo "Images built successfully!"
echo "  - ${PREFIX}finance-tracker-server:${TAG}"
echo "  - ${PREFIX}finance-tracker-client:${TAG}"

if [ -n "$REGISTRY" ]; then
    echo ""
    echo "To push to registry:"
    echo "  docker push ${PREFIX}finance-tracker-server:${TAG}"
    echo "  docker push ${PREFIX}finance-tracker-client:${TAG}"
fi
