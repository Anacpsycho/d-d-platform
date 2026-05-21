#!/bin/bash

# D&D 5E Character Sheet - Stop Script for Podman
# This script stops and removes the application pod

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}D&D 5E Character Sheet - Stop Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${RED}Error: Podman is not installed${NC}"
    exit 1
fi

# Check if pod exists
if ! podman pod exists dnd-app-pod; then
    echo -e "${YELLOW}Pod 'dnd-app-pod' does not exist or is not running${NC}"
    exit 0
fi

# Ask for confirmation
echo -e "${YELLOW}This will stop and remove the pod 'dnd-app-pod' and all its containers.${NC}"
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi
echo ""

# Stop the pod
echo -e "${YELLOW}Stopping pod...${NC}"
podman pod stop dnd-app-pod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pod stopped successfully${NC}"
else
    echo -e "${RED}✗ Failed to stop pod${NC}"
    exit 1
fi
echo ""

# Remove the pod
echo -e "${YELLOW}Removing pod...${NC}"
podman pod rm dnd-app-pod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Pod removed successfully${NC}"
else
    echo -e "${RED}✗ Failed to remove pod${NC}"
    exit 1
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Pod stopped and removed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Note: Data volumes in ./data/ directory are preserved.${NC}"
echo "To remove data volumes, run: rm -rf ./data/"
echo ""
echo "To restart the application, run: ./deploy.sh"
echo ""

# Made with Bob
