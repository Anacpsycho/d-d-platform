# D&D 5E Character Sheet - Deployment Guide

Complete deployment guide for the D&D 5th Edition Character Sheet web application using Podman.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Building Images](#building-images)
- [Deploying the Application](#deploying-the-application)
- [Managing the Application](#managing-the-application)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Backup and Restore](#backup-and-restore)

---

## 🔧 Prerequisites

### Required Software

1. **Podman** (version 4.0 or higher)
   - Linux: `sudo apt install podman` or `sudo dnf install podman`
   - macOS: `brew install podman`
   - Windows: Download from [podman.io](https://podman.io/getting-started/installation)

2. **Git** (for cloning the repository)
   ```bash
   git --version
   ```

3. **Text Editor** (for configuration)
   - VS Code, nano, vim, or any text editor

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space minimum
- **OS**: Linux, macOS, or Windows with WSL2

### Verify Podman Installation

```bash
podman --version
podman info
```

---

## 🚀 Quick Start

Get the application running in 5 minutes:

```bash
# 1. Clone the repository (or navigate to project directory)
cd /path/to/dnd-character-sheet

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your preferred editor and update JWT_SECRET and passwords

# 3. Make scripts executable
chmod +x build.sh deploy.sh stop.sh

# 4. Build all container images
./build.sh

# 5. Deploy the application
./deploy.sh

# 6. Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:3000
```

---

## 📁 Project Structure

```
dnd-character-sheet/
├── backend/                    # NestJS Backend
│   ├── src/                   # Source code (to be created)
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── nest-cli.json          # NestJS CLI configuration
│   └── Containerfile          # Backend container image
│
├── frontend/                   # React Frontend
│   ├── src/                   # Source code (to be created)
│   ├── public/                # Static assets (to be created)
│   ├── package.json           # Frontend dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite build configuration
│   ├── nginx.conf             # Nginx config for frontend container
│   └── Containerfile          # Frontend container image
│
├── nginx/                      # Reverse Proxy
│   ├── nginx.conf             # Main nginx configuration
│   └── Containerfile          # Nginx container image
│
├── data/                       # Persistent data (created on deploy)
│   ├── mongodb/               # MongoDB data
│   └── redis/                 # Redis data
│
├── pod.yaml                    # Podman pod configuration
├── build.sh                    # Build script
├── deploy.sh                   # Deployment script
├── stop.sh                     # Stop script
├── .env.example               # Environment variables template
└── README-DEPLOYMENT.md       # This file
```

---

## ⚙️ Configuration

### Environment Variables

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the .env file:**
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Critical variables to update:**

   ```bash
   # MUST CHANGE - Security Critical
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
   MONGO_INITDB_ROOT_PASSWORD=changeme123
   
   # Backend URLs (update for production)
   VITE_API_URL=http://localhost:3000
   VITE_WS_URL=http://localhost:3000
   
   # Optional - External APIs
   GOOGLE_SHEETS_API_KEY=your-api-key-here
   ```

### Security Best Practices

⚠️ **IMPORTANT**: Before deploying to production:

1. Generate a strong JWT secret (minimum 32 characters):
   ```bash
   openssl rand -base64 32
   ```

2. Use strong database passwords:
   ```bash
   openssl rand -base64 24
   ```

3. Never commit `.env` file to version control
4. Use environment-specific configurations

---

## 🏗️ Building Images

### Build All Images

```bash
./build.sh
```

This script will:
1. Build the backend NestJS image
2. Build the frontend React image
3. Build the nginx reverse proxy image

### Build Individual Images

If you need to rebuild a specific service:

```bash
# Backend only
podman build -t localhost/dnd-backend:latest -f backend/Containerfile backend/

# Frontend only
podman build -t localhost/dnd-frontend:latest \
  --build-arg VITE_API_URL=http://localhost:3000 \
  --build-arg VITE_WS_URL=http://localhost:3000 \
  -f frontend/Containerfile frontend/

# Nginx only
podman build -t localhost/dnd-nginx:latest -f nginx/Containerfile nginx/
```

### Verify Built Images

```bash
podman images | grep dnd
```

Expected output:
```
localhost/dnd-backend   latest   <image-id>   <time>   <size>
localhost/dnd-frontend  latest   <image-id>   <time>   <size>
localhost/dnd-nginx     latest   <image-id>   <time>   <size>
```

---

## 🚢 Deploying the Application

### Deploy with Script

```bash
./deploy.sh
```

This script will:
1. Check for required images
2. Create data directories
3. Deploy the pod with all services
4. Display status and access URLs

### Manual Deployment

```bash
# Create data directories
mkdir -p ./data/mongodb ./data/redis

# Deploy the pod
podman play kube pod.yaml

# Check status
podman pod ps
podman ps --filter pod=dnd-app-pod
```

### Verify Deployment

1. **Check pod status:**
   ```bash
   podman pod ps
   ```
   Status should be "Running"

2. **Check all containers:**
   ```bash
   podman ps --filter pod=dnd-app-pod
   ```
   All 5 containers should be "Up"

3. **Test endpoints:**
   ```bash
   # Frontend
   curl http://localhost:80
   
   # Backend health
   curl http://localhost:3000/health
   
   # Nginx health
   curl http://localhost:80/health
   ```

4. **Access in browser:**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000/api

---

## 🔧 Managing the Application

### View Logs

```bash
# All pod logs
podman pod logs -f dnd-app-pod

# Individual service logs
podman logs -f dnd-app-pod-backend
podman logs -f dnd-app-pod-frontend
podman logs -f dnd-app-pod-nginx
podman logs -f dnd-app-pod-mongodb
podman logs -f dnd-app-pod-redis

# Last 100 lines
podman logs --tail 100 dnd-app-pod-backend
```

### Check Status

```bash
# Pod status
podman pod ps

# Container status
podman ps --filter pod=dnd-app-pod

# Detailed pod info
podman pod inspect dnd-app-pod

# Resource usage
podman stats --no-stream --filter pod=dnd-app-pod
```

### Stop the Application

```bash
./stop.sh
```

Or manually:
```bash
podman pod stop dnd-app-pod
podman pod rm dnd-app-pod
```

### Restart the Application

```bash
# Stop first
./stop.sh

# Then deploy again
./deploy.sh
```

### Update a Service

```bash
# 1. Rebuild the image
./build.sh  # or build specific service

# 2. Stop the pod
./stop.sh

# 3. Deploy again
./deploy.sh
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Error: port 80 is already allocated`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :80
# or
sudo netstat -tulpn | grep :80

# Stop the conflicting service or change ports in pod.yaml
```

#### 2. Images Not Found

**Error:** `Error: image not found`

**Solution:**
```bash
# Build all images
./build.sh

# Verify images exist
podman images | grep dnd
```

#### 3. Permission Denied on Scripts

**Error:** `Permission denied: ./build.sh`

**Solution:**
```bash
chmod +x build.sh deploy.sh stop.sh
```

#### 4. MongoDB Connection Failed

**Error:** `MongoServerError: Authentication failed`

**Solution:**
```bash
# Check MongoDB logs
podman logs dnd-app-pod-mongodb

# Verify credentials in .env match pod.yaml
# Restart the pod
./stop.sh && ./deploy.sh
```

#### 5. Frontend Shows 502 Bad Gateway

**Cause:** Backend not ready yet

**Solution:**
```bash
# Wait 30 seconds for backend to start
# Check backend logs
podman logs dnd-app-pod-backend

# Check backend health
curl http://localhost:3000/health
```

#### 6. WebSocket Connection Failed

**Cause:** Nginx proxy configuration or CORS

**Solution:**
```bash
# Check nginx logs
podman logs dnd-app-pod-nginx

# Verify CORS_ORIGIN in .env
# Restart pod
./stop.sh && ./deploy.sh
```

### Debug Mode

Enable detailed logging:

```bash
# Edit .env
LOG_LEVEL=debug

# Rebuild and redeploy
./build.sh
./stop.sh
./deploy.sh
```

### Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:8080/health

# Nginx health
curl http://localhost:80/health

# MongoDB health
podman exec dnd-app-pod-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis health
podman exec dnd-app-pod-redis redis-cli ping
```

---

## 🌐 Production Deployment

### SSL/TLS Configuration

1. **Obtain SSL certificates:**
   ```bash
   # Using Let's Encrypt (example)
   sudo certbot certonly --standalone -d yourdomain.com
   ```

2. **Update nginx configuration:**
   - Edit `nginx/nginx.conf`
   - Uncomment HTTPS server block
   - Update certificate paths

3. **Mount certificates in pod.yaml:**
   ```yaml
   volumeMounts:
   - name: ssl-certs
     mountPath: /etc/nginx/ssl
   ```

### Environment-Specific Configuration

Create separate environment files:

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

Load appropriate file:
```bash
cp .env.production .env
./build.sh
./deploy.sh
```

### Security Hardening

1. **Change default passwords:**
   ```bash
   # Generate strong passwords
   openssl rand -base64 32
   ```

2. **Enable firewall:**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Use secrets management:**
   - Consider using Podman secrets
   - Or external secret managers (Vault, etc.)

4. **Regular updates:**
   ```bash
   # Update base images
   podman pull node:20-alpine
   podman pull mongo:6
   podman pull redis:7-alpine
   podman pull nginx:alpine
   
   # Rebuild
   ./build.sh
   ```

### Monitoring

1. **Set up logging:**
   - Configure log aggregation (ELK, Loki, etc.)
   - Monitor application logs

2. **Health monitoring:**
   - Set up uptime monitoring
   - Configure alerts

3. **Resource monitoring:**
   ```bash
   # Monitor resource usage
   podman stats dnd-app-pod
   ```

---

## 💾 Backup and Restore

### Backup MongoDB

```bash
# Create backup directory
mkdir -p ./backups

# Backup MongoDB
podman exec dnd-app-pod-mongodb mongodump \
  --username admin \
  --password changeme123 \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup from container
podman cp dnd-app-pod-mongodb:/data/backup ./backups/mongodb-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
# Copy backup to container
podman cp ./backups/mongodb-20240101 dnd-app-pod-mongodb:/data/restore

# Restore
podman exec dnd-app-pod-mongodb mongorestore \
  --username admin \
  --password changeme123 \
  --authenticationDatabase admin \
  /data/restore
```

### Backup Redis

```bash
# Trigger Redis save
podman exec dnd-app-pod-redis redis-cli SAVE

# Copy RDB file
podman cp dnd-app-pod-redis:/data/dump.rdb ./backups/redis-$(date +%Y%m%d).rdb
```

### Automated Backups

Create a backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
podman exec dnd-app-pod-mongodb mongodump \
  --username admin \
  --password changeme123 \
  --authenticationDatabase admin \
  --out /data/backup

podman cp dnd-app-pod-mongodb:/data/backup "$BACKUP_DIR/mongodb"

# Backup Redis
podman exec dnd-app-pod-redis redis-cli SAVE
podman cp dnd-app-pod-redis:/data/dump.rdb "$BACKUP_DIR/redis.rdb"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 📚 Additional Resources

### Documentation

- [Complete Technical Specification](COMPLETE_TECHNICAL_SPECIFICATION.md)
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)
- [Podman Documentation](https://docs.podman.io/)

### Useful Commands

```bash
# Remove all stopped containers
podman container prune

# Remove unused images
podman image prune

# Remove unused volumes
podman volume prune

# System cleanup
podman system prune -a

# Export pod configuration
podman generate kube dnd-app-pod > pod-export.yaml

# View pod events
podman pod events dnd-app-pod
```

### Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review application logs
3. Consult the technical documentation
4. Check Podman documentation

---

## 📝 Notes

- **Data Persistence**: MongoDB and Redis data is stored in `./data/` directory
- **Port Conflicts**: Ensure ports 80, 443, 3000, 6379, 8080, and 27017 are available
- **Resource Limits**: Adjust resource limits in `pod.yaml` based on your system
- **Development vs Production**: Use appropriate environment configurations
- **Updates**: Regularly update base images and dependencies for security

---

**Version:** 1.0  
**Last Updated:** 2024  
**Deployment Method:** Podman Pod  
**Architecture:** Microservices (Backend, Frontend, Database, Cache, Proxy)