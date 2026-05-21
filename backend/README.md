# D&D 5E Character Sheet - Backend API

NestJS-based backend API for the D&D 5E Character Sheet application.

## Features

- ✅ JWT Authentication (Access + Refresh tokens)
- ✅ User Management
- ✅ MongoDB with Mongoose
- ✅ Input Validation
- ✅ Rate Limiting
- ✅ Exception Filters
- ✅ Unit & E2E Tests

## Prerequisites

- Node.js 18+ 
- MongoDB 6+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `FRONTEND_URL`: Frontend URL for CORS

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile

### Users

- `GET /api/users` - Get all users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update current user profile
- `PUT /api/users/:id` - Update user by ID
- `DELETE /api/users/profile` - Delete current user
- `DELETE /api/users/:id` - Delete user by ID
- `GET /api/users/:id/stats` - Get user statistics

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/                 # Configuration files
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   ├── modules/
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── guards/        # Auth guards
│   │   │   ├── strategies/    # Passport strategies
│   │   │   └── schemas/       # Mongoose schemas
│   │   └── users/             # Users module
│   │       ├── users.module.ts
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       ├── dto/
│   │       └── schemas/
│   └── common/                # Shared utilities
│       ├── decorators/        # Custom decorators
│       ├── filters/           # Exception filters
│       ├── guards/            # Global guards
│       ├── interceptors/      # Interceptors
│       └── pipes/             # Validation pipes
├── test/                      # E2E tests
└── package.json
```

## Database Schema

### Users Collection
- `_id`: ObjectId
- `email`: String (unique)
- `username`: String (unique)
- `passwordHash`: String
- `createdAt`: Date
- `updatedAt`: Date

### Refresh Tokens Collection
- `_id`: ObjectId
- `userId`: ObjectId (ref: User)
- `token`: String
- `expiresAt`: Date
- `revoked`: Boolean
- `createdAt`: Date
- `updatedAt`: Date

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with short expiration (15 minutes)
- Refresh tokens with longer expiration (7 days)
- Rate limiting enabled
- Input validation on all endpoints
- CORS configured for frontend

## Next Steps

After setting up the backend core:

1. Add Character Sheet module
2. Add Campaign management
3. Add WebSocket support for real-time features
4. Add Game Events system
5. Add Combat tracker
6. Add Messaging system

## License

MIT