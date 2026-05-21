# D&D 5E Character Sheet - Build and Run Instructions

## Prerequisites

Before building and running the application, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **MongoDB** (v6 or higher)
- **Git**

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd progetto personale
```

### 2. Environment Configuration

#### Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/dnd
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### 3. Install Dependencies

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

### 4. Start MongoDB

Ensure MongoDB is running on your system:

**Windows:**
```bash
net start MongoDB
```

**Linux/Mac:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 5. Build the Application

#### Backend Build

```bash
cd backend
npm run build
```

This compiles TypeScript to JavaScript in the `dist` folder.

#### Frontend Build

```bash
cd ../frontend
npm run build
```

This creates an optimized production build in the `dist` folder.

## Running the Application

### Development Mode

#### Backend (Development)

```bash
cd backend
npm run start:dev
```

The backend will start on `http://localhost:3000` with hot-reload enabled.

#### Frontend (Development)

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` with hot-reload enabled.

### Production Mode

#### Backend (Production)

```bash
cd backend
npm run start:prod
```

#### Frontend (Production)

After building, serve the frontend using a static file server:

```bash
cd frontend
npx serve -s dist -l 5173
```

Or use nginx/apache to serve the `frontend/dist` folder.

## Available Scripts

### Backend Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot-reload
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint the code

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint the code
- `npm run test` - Run tests

## Docker Deployment (Optional)

### Using Docker Compose

Create a `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: dnd-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: changeme123
      MONGO_INITDB_DATABASE: dnd
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: ./backend
      dockerfile: Containerfile
    container_name: dnd-backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mongodb://admin:changeme123@mongodb:27017/dnd?authSource=admin
      JWT_SECRET: your-secret-key-change-in-production
      JWT_REFRESH_SECRET: your-refresh-secret-change-in-production
      FRONTEND_URL: http://localhost:80
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Containerfile
    container_name: dnd-frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

Run with Docker Compose:

```bash
docker-compose up -d
```

## Troubleshooting

### MongoDB Connection Issues

If you encounter MongoDB connection errors:

1. Verify MongoDB is running: `mongosh` or `mongo`
2. Check the DATABASE_URL in your `.env` file
3. Ensure MongoDB is accessible on the specified port

### Port Already in Use

If ports 3000 or 5173 are already in use:

1. Change the PORT in `backend/.env`
2. Update VITE_API_URL in `frontend/.env` accordingly
3. Or stop the process using the port

### Build Errors

If you encounter build errors:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Ensure you're using compatible Node.js version (v18+)

### CORS Issues

If you encounter CORS errors:

1. Verify FRONTEND_URL in `backend/.env` matches your frontend URL
2. Check that the backend CORS configuration allows your frontend origin

## Testing the Application

### Access the Application

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account or login
3. Create a character sheet
4. Start a game session

### API Documentation

The backend API is available at `http://localhost:3000/api`

Key endpoints:
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/characters` - Get characters
- `POST /api/characters` - Create character
- `GET /api/sessions` - Get sessions
- `POST /api/sessions` - Create session

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in backend `.env`
2. Use strong, unique values for JWT secrets
3. Configure proper MongoDB authentication
4. Use HTTPS for both frontend and backend
5. Set up proper logging and monitoring
6. Configure rate limiting and security headers
7. Use a reverse proxy (nginx/apache) for the frontend

## Support

For issues or questions:
- Check the documentation in the `docs` folder
- Review the implementation guides
- Check existing issues in the repository

---

**Made with Bob**