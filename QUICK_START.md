# 🚀 Quick Start Guide

Get your D&D 5E Character Sheet application running in minutes!

## ⚡ 5-Minute Setup

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Update JWT_SECRET and passwords

# 2. Make scripts executable
chmod +x build.sh deploy.sh stop.sh

# 3. Build images (takes 5-10 minutes)
./build.sh

# 4. Deploy application
./deploy.sh

# 5. Access the app
# Frontend: http://localhost:80
# Backend:  http://localhost:3000
```

## 📦 What Gets Deployed

The pod includes 5 containers:
- **MongoDB** (port 27017) - Database
- **Redis** (port 6379) - Cache
- **Backend** (port 3000) - NestJS API
- **Frontend** (port 8080) - React app
- **Nginx** (port 80) - Reverse proxy

## 🔑 Important Security Steps

Before deploying to production:

1. **Generate strong JWT secret:**
   ```bash
   openssl rand -base64 32
   ```
   Update `JWT_SECRET` in `.env`

2. **Change database password:**
   ```bash
   openssl rand -base64 24
   ```
   Update `MONGO_INITDB_ROOT_PASSWORD` in `.env`

3. **Update CORS origin:**
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   ```

## 📋 Common Commands

```bash
# View logs
podman logs -f dnd-app-pod-backend
podman logs -f dnd-app-pod-frontend

# Check status
podman pod ps
podman ps --filter pod=dnd-app-pod

# Stop application
./stop.sh

# Restart application
./stop.sh && ./deploy.sh

# Rebuild after changes
./build.sh
./stop.sh
./deploy.sh
```

## 🐛 Troubleshooting

### Port already in use
```bash
# Find what's using port 80
sudo lsof -i :80
# Stop the service or change ports in pod.yaml
```

### Images not found
```bash
./build.sh
```

### Backend not responding
```bash
# Wait 30 seconds for startup
# Check logs
podman logs dnd-app-pod-backend
```

## 📚 Next Steps

1. Read [README-DEPLOYMENT.md](README-DEPLOYMENT.md) for detailed documentation
2. Review [COMPLETE_TECHNICAL_SPECIFICATION.md](COMPLETE_TECHNICAL_SPECIFICATION.md)
3. Start implementing backend services (see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md))
4. Build frontend components

## 🎯 Project Structure

```
/
├── backend/          # NestJS backend (add src/ directory)
├── frontend/         # React frontend (add src/ directory)
├── nginx/            # Reverse proxy config
├── data/             # Persistent data (auto-created)
├── pod.yaml          # Podman configuration
├── build.sh          # Build script
├── deploy.sh         # Deploy script
├── stop.sh           # Stop script
└── .env              # Your configuration
```

## ✅ Verification Checklist

- [ ] Podman installed and working
- [ ] `.env` file configured with strong secrets
- [ ] All images built successfully
- [ ] Pod deployed and running
- [ ] Frontend accessible at http://localhost:80
- [ ] Backend health check passes: `curl http://localhost:3000/health`
- [ ] MongoDB connected (check backend logs)
- [ ] Redis connected (check backend logs)

---

**Ready to code?** Start with Session 2 in [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)!