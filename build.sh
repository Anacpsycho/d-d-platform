#!/bin/bash

# D&D 5E Character Sheet - Build Script for Podman
# This script builds all container images for the application

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}D&D 5E Character Sheet - Build Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed${NC}"
    echo "Please install Podman first: https://podman.io/getting-started/installation"
    exit 1
fi

echo -e "${YELLOW}Podman version:${NC}"
podman --version
echo ""

# Load environment variables if .env exists
if [ -f .env ]; then
    echo -e "${YELLOW}Loading environment variables from .env${NC}"
    export $(cat .env | grep -v '^#' | xargs)
    echo ""
fi

# Set default values if not provided
VITE_API_URL=${VITE_API_URL:-http://localhost:3000}
VITE_WS_URL=${VITE_WS_URL:-http://localhost:3000}

# Build Backend
echo -e "${YELLOW}[1/3] Building Backend Image...${NC}"
podman build \
    -t localhost/dnd-backend:latest \
    -f backend/Containerfile \
    backend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
else
    echo -e "${RED}✗ Backend build failed${NC}"
    exit 1
fi
echo ""

# Build Frontend
echo -e "${YELLOW}[2/3] Building Frontend Image...${NC}"
podman build \
    -t localhost/dnd-frontend:latest \
    --build-arg VITE_API_URL=${VITE_API_URL} \
    --build-arg VITE_WS_URL=${VITE_WS_URL} \
    -f frontend/Containerfile \
    frontend/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo ""

# Build Nginx
echo -e "${YELLOW}[3/3] Building Nginx Image...${NC}"
podman build \
    -t localhost/dnd-nginx:latest \
    -f nginx/Containerfile \
    nginx/

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx image built successfully${NC}"
else
    echo -e "${RED}✗ Nginx build failed${NC}"
    exit 1
fi
echo ""

# List built images
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Built Images:${NC}"
echo -e "${GREEN}========================================${NC}"
podman images | grep -E "dnd-(backend|frontend|nginx)|REPOSITORY"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Review and update .env file with your configuration"
echo "  2. Run './deploy.sh' to start the application"
echo ""

# Made with Bob
