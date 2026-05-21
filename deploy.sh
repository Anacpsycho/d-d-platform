#!/bin/bash

# D&D 5E Character Sheet - Deploy Script for Podman
# This script deploys the application using Podman pod

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}D&D 5E Character Sheet - Deploy Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed${NC}"
    echo "Please install Podman first: https://podman.io/getting-started/installation"
    exit 1
fi

# Check if images exist
echo -e "${YELLOW}Checking for required images...${NC}"
IMAGES_MISSING=0

if ! podman image exists localhost/dnd-backend:latest; then
    echo -e "${RED}✗ Backend image not found${NC}"
    IMAGES_MISSING=1
fi

if ! podman image exists localhost/dnd-frontend:latest; then
    echo -e "${RED}✗ Frontend image not found${NC}"
    IMAGES_MISSING=1
fi

if ! podman image exists localhost/dnd-nginx:latest; then
    echo -e "${RED}✗ Nginx image not found${NC}"
    IMAGES_MISSING=1
fi

if [ $IMAGES_MISSING -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}Some images are missing. Run './build.sh' first to build all images.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All required images found${NC}"
echo ""

# Create data directories
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p ./data/mongodb
mkdir -p ./data/redis
echo -e "${GREEN}✓ Data directories created${NC}"
echo ""

# Check if pod already exists
if podman pod exists dnd-app-pod; then
    echo -e "${YELLOW}Pod 'dnd-app-pod' already exists${NC}"
    read -p "Do you want to stop and remove it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Stopping and removing existing pod...${NC}"
        podman pod stop dnd-app-pod
        podman pod rm dnd-app-pod
        echo -e "${GREEN}✓ Existing pod removed${NC}"
    else
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi
echo ""

# Deploy the pod
echo -e "${YELLOW}Deploying pod from pod.yaml...${NC}"
podman play kube pod.yaml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pod deployed successfully${NC}"
else
    echo -e "${RED}✗ Pod deployment failed${NC}"
    exit 1
fi
echo ""

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check pod status
echo -e "${YELLOW}Checking pod status...${NC}"
podman pod ps --filter name=dnd-app-pod
echo ""

# Check container status
echo -e "${YELLOW}Checking container status...${NC}"
podman ps --filter pod=dnd-app-pod
echo ""

# Display logs option
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo "  Frontend:  http://localhost:80"
echo "  Backend:   http://localhost:3000"
echo "  MongoDB:   mongodb://localhost:27017"
echo "  Redis:     redis://localhost:6379"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo "  View pod status:       podman pod ps"
echo "  View containers:       podman ps --filter pod=dnd-app-pod"
echo "  View backend logs:     podman logs -f dnd-app-pod-backend"
echo "  View frontend logs:    podman logs -f dnd-app-pod-frontend"
echo "  View nginx logs:       podman logs -f dnd-app-pod-nginx"
echo "  View all logs:         podman pod logs -f dnd-app-pod"
echo "  Stop pod:              ./stop.sh"
echo ""
echo -e "${YELLOW}Note: It may take a few moments for all services to be fully ready.${NC}"
echo ""

# Made with Bob
