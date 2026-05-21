# D&D 5E Character Sheet Web Application
## Complete Technical Specification & Implementation Guide

**Version:** 1.0  
**Date:** 2024  
**Project:** D&D 5th Edition Character Sheet Management System  
**Architecture:** Three-tier (Frontend, Backend, Database)

---

## Executive Summary

This document serves as the master technical specification for implementing a complete D&D 5E character sheet web application. It consolidates all technical documentation and provides a comprehensive implementation roadmap.

### Project Scope

A full-featured web application that enables:
- **Players**: Create and manage D&D 5E characters with automatic calculations, real-time updates during sessions, spell/inventory management, and communication tools
- **Dungeon Masters**: Run campaigns with session management, combat tracking, NPC management, encounter building, and master-specific tools
- **Both**: Real-time collaboration via WebSocket, event sourcing for complete audit trails, and integration with external D&D resources

### Key Technical Features

✅ **Three-tier Architecture** - Separated frontend, backend, and database layers  
✅ **Real-time Synchronization** - WebSocket-based instant updates  
✅ **Event Sourcing** - Complete audit trail of all game actions  
✅ **External Integration** - Google Sheets reference data, SRD API  
✅ **Custom Scripts** - Homebrew content support with sandboxed execution  
✅ **Role-based Access** - Master and Player permissions  
✅ **Responsive Design** - Desktop and mobile support  

---

## Documentation Structure

This specification is organized across multiple detailed documents. Each document focuses on a specific aspect of the system:

### 📄 Core Documentation Files

1. **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** (1,337 lines)
   - Complete technology stack
   - Database schema (all tables)
   - Backend services architecture
   - API endpoints (100+ endpoints)
   - Frontend component hierarchy
   - Development setup instructions

2. **[ADVANCED_LOGIC_DOCUMENTATION.md](ADVANCED_LOGIC_DOCUMENTATION.md)** (1,337 lines)
   - Character sheet calculation formulas
   - Validation rules and constraints
   - JSON parsing and data transformation
   - Import/export functionality
   - Recalculation triggers
   - Data integrity checks

3. **[PDF_FUNCTIONS_AND_FEATURES.md](PDF_FUNCTIONS_AND_FEATURES.md)** (717 lines)
   - Original PDF analysis
   - 17 toolbar button functions
   - 16 functions panel items
   - Field interactions and behaviors
   - UI/UX patterns from PDF

4. **[EXTRACTED_JAVASCRIPT_STRUCTURES.md](EXTRACTED_JAVASCRIPT_STRUCTURES.md)** (717 lines)
   - Original JavaScript code structures
   - Data models from PDF
   - Calculation logic patterns
   - Field dependencies

5. **[CUSTOM_SCRIPT_IMPORT_SYSTEM.md](CUSTOM_SCRIPT_IMPORT_SYSTEM.md)** (847 lines)
   - Sandbox execution environment
   - Security validation
   - Script merging strategies
   - API for custom scripts
   - Homebrew content support

6. **[CAMPAIGN_MANAGEMENT_SYSTEM.md](CAMPAIGN_MANAGEMENT_SYSTEM.md)** (1,337 lines)
   - Multi-user campaign structure
   - Master/Player roles
   - Source material management
   - Campaign settings
   - Player invitations

7. **[GAME_SESSION_EVENTS_SYSTEM.md](GAME_SESSION_EVENTS_SYSTEM.md)** (1,254 lines)
   - Event-driven architecture
   - 30+ event types
   - HP/damage management
   - Rest system (short/long)
   - Dice rolling system
   - Resource tracking
   - Combat tracker
   - Spell casting events
   - Conditions and status effects
   - Event log and history
   - Real-time WebSocket sync

8. **[MASTER_TOOLS_AND_MESSAGING_SYSTEM.md](MASTER_TOOLS_AND_MESSAGING_SYSTEM.md)** (1,254 lines)
   - Master combat management
   - Private messaging (Master-Player, Player-Player)
   - Group chat
   - Secret rolls and hidden NPCs
   - NPC management
   - Encounter builder
   - Session notes
   - Master dashboard

**Total Documentation: 9,000+ lines of technical specifications**

---

## Quick Start Implementation Guide

### Phase 1: Foundation (Weeks 1-2)

**Backend Setup:**
```bash
# Initialize NestJS project
npm i -g @nestjs/cli
nest new dnd-backend
cd dnd-backend

# Install core dependencies
npm install @nestjs/mongoose mongoose
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install class-validator class-transformer
npm install bcrypt
```

**Frontend Setup:**
```bash
# Initialize React project
npm create vite@latest dnd-frontend -- --template react-ts
cd dnd-frontend

# Install core dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom
npm install zustand
npm install @tanstack/react-query
npm install socket.io-client
npm install react-hook-form
```

**Database Setup:**
```bash
# MongoDB with Docker
docker run -d -p 27017:27017 --name dnd-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:6

# Or PostgreSQL
docker run -d -p 5432:5432 --name dnd-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dnd \
  postgres:15
```

### Phase 2: Core Features (Weeks 3-6)

**Priority Order:**
1. ✅ User authentication (JWT)
2. ✅ Character sheet CRUD
3. ✅ Calculation engine
4. ✅ Campaign management
5. ✅ Basic session management

**Reference Documents:**
- Database schema: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#database-schema)
- Calculations: [ADVANCED_LOGIC_DOCUMENTATION.md](ADVANCED_LOGIC_DOCUMENTATION.md#calculation-logic)
- API endpoints: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#api-endpoints)

### Phase 3: Real-time Features (Weeks 7-10)

**Priority Order:**
1. ✅ WebSocket integration
2. ✅ Game events system
3. ✅ Combat tracker
4. ✅ Dice rolling
5. ✅ HP/damage management

**Reference Documents:**
- Events system: [GAME_SESSION_EVENTS_SYSTEM.md](GAME_SESSION_EVENTS_SYSTEM.md)
- WebSocket: [GAME_SESSION_EVENTS_SYSTEM.md](GAME_SESSION_EVENTS_SYSTEM.md#real-time-synchronization)

### Phase 4: Master Tools (Weeks 11-14)

**Priority Order:**
1. ✅ Master combat management
2. ✅ Messaging system
3. ✅ NPC management
4. ✅ Encounter builder
5. ✅ Session notes

**Reference Documents:**
- Master tools: [MASTER_TOOLS_AND_MESSAGING_SYSTEM.md](MASTER_TOOLS_AND_MESSAGING_SYSTEM.md)
- Messaging: [MASTER_TOOLS_AND_MESSAGING_SYSTEM.md](MASTER_TOOLS_AND_MESSAGING_SYSTEM.md#sistema-messaggistica)

### Phase 5: Advanced Features (Weeks 15-18)

**Priority Order:**
1. ✅ External data integration
2. ✅ Custom scripts
3. ✅ Import/export
4. ✅ Advanced calculations
5. ✅ Performance optimization

**Reference Documents:**
- External integration: [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#external-data-integration)
- Custom scripts: [CUSTOM_SCRIPT_IMPORT_SYSTEM.md](CUSTOM_SCRIPT_IMPORT_SYSTEM.md)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  React App (TypeScript) + Material-UI + Socket.io-client    │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────┼─────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  ┌──────────────────┬─┴────────────────┐                    │
│  │   REST API       │   WebSocket      │                    │
│  │  (NestJS/Express)│   (Socket.io)    │                    │
│  └────────┬─────────┴──────────┬───────┘                    │
│           │                    │                             │
│  ┌────────▼────────────────────▼───────┐                    │
│  │      Business Logic Layer           │                    │
│  │  • Character Service                │                    │
│  │  • Campaign Service                 │                    │
│  │  • Combat Service                   │                    │
│  │  • Event Service                    │                    │
│  │  • Messaging Service                │                    │
│  │  • Calculation Engine               │                    │
│  └─────────────────┬───────────────────┘                    │
└────────────────────┼─────────────────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────────────────┐
│                 DATA LAYER                                   │
│  ┌───────────────┬─┴──────────┬──────────────┐             │
│  │   MongoDB/    │   Redis    │    Cloud     │             │
│  │  PostgreSQL   │   Cache    │   Storage    │             │
│  └───────────────┴────────────┴──────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack Summary

**Backend:**
- Framework: NestJS 10.x (TypeScript)
- Database: MongoDB 6.x or PostgreSQL 15.x
- WebSocket: Socket.io 4.x
- Auth: JWT with Passport.js
- Validation: class-validator

**Frontend:**
- Framework: React 18.x (TypeScript)
- UI: Material-UI 5.x or Tailwind CSS
- State: Zustand + React Query
- WebSocket: Socket.io-client
- Forms: React Hook Form

**Infrastructure:**
- Containerization: Docker
- Reverse Proxy: Nginx
- Caching: Redis (optional)
- CI/CD: GitHub Actions

---

## Complete Database Schema Summary

### Core Tables

**Users & Auth:**
- `users` - User accounts and profiles
- `refresh_tokens` - JWT refresh tokens

**Characters:**
- `character_sheets` - Complete D&D 5E character data
  - Basic info, ability scores, proficiencies
  - Combat stats, HP, AC, initiative
  - Spells, spell slots, spellcasting
  - Equipment, inventory, currency
  - Features, traits, background
  - Current state (conditions, concentration, etc.)

**Campaigns:**
- `campaigns` - Campaign settings and configuration
- `campaign_invites` - Player invitation codes

**Sessions & Events:**
- `game_sessions` - Game session tracking
- `game_events` - Event sourcing (30+ event types)
- `combat_encounters` - Combat state
- `combat_participants` - Initiative tracker

**Communication:**
- `messages` - Chat messages
- `conversations` - Chat conversations

**Master Tools:**
- `npcs` - NPC/monster management
- `encounters` - Encounter builder
- `session_notes` - Session notes

**Total: 13 main tables + relationships**

For complete schema details, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#database-schema)

---

## Complete API Endpoints Summary

### Authentication (5 endpoints)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### Characters (8 endpoints)
```
POST   /api/characters
GET    /api/characters
GET    /api/characters/:id
PUT    /api/characters/:id
DELETE /api/characters/:id
POST   /api/characters/:id/level-up
POST   /api/characters/:id/import
GET    /api/characters/:id/export
```

### Campaigns (10 endpoints)
```
POST   /api/campaigns
GET    /api/campaigns
GET    /api/campaigns/:id
PUT    /api/campaigns/:id
DELETE /api/campaigns/:id
POST   /api/campaigns/:id/invite
POST   /api/campaigns/join/:code
POST   /api/campaigns/:id/players
DELETE /api/campaigns/:id/players/:userId
PUT    /api/campaigns/:id/sources
```

### Sessions (6 endpoints)
```
POST   /api/sessions
GET    /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id
GET    /api/campaigns/:id/sessions
POST   /api/sessions/:id/end
```

### Game Events (15 endpoints)
```
POST   /api/sessions/:id/damage
POST   /api/sessions/:id/healing
POST   /api/sessions/:id/temp-hp
POST   /api/sessions/:id/short-rest
POST   /api/sessions/:id/long-rest
POST   /api/sessions/:id/roll-ability
POST   /api/sessions/:id/roll-save
POST   /api/sessions/:id/roll-attack
POST   /api/sessions/:id/roll-damage
POST   /api/sessions/:id/use-spell
POST   /api/sessions/:id/use-feature
POST   /api/sessions/:id/use-hit-dice
GET    /api/sessions/:id/events
GET    /api/characters/:id/events
POST   /api/events/:id/rollback
```

### Combat (10 endpoints)
```
POST   /api/sessions/:id/combat/start
POST   /api/sessions/:id/combat/next
POST   /api/sessions/:id/combat/end
GET    /api/sessions/:id/combat
POST   /api/combat/:id/add-npc
DELETE /api/combat/:id/participant/:pid
PUT    /api/combat/:id/participant/:pid/hp
POST   /api/combat/:id/secret-roll
POST   /api/combat/:id/aoe-damage
POST   /api/combat/:id/bulk-condition
```

### Messaging (8 endpoints)
```
POST   /api/messages/private
POST   /api/messages/group
POST   /api/messages/masters
GET    /api/conversations/:campaignId
GET    /api/conversations/:id/messages
PUT    /api/messages/:id/read
POST   /api/messages/:id/reaction
POST   /api/messages/share-roll
```

### NPCs (6 endpoints)
```
POST   /api/npcs
GET    /api/npcs/:campaignId
GET    /api/npcs/:id
PUT    /api/npcs/:id
DELETE /api/npcs/:id
POST   /api/npcs/import-srd
```

### Encounters (6 endpoints)
```
POST   /api/encounters
GET    /api/encounters/:campaignId
GET    /api/encounters/:id
PUT    /api/encounters/:id
DELETE /api/encounters/:id
POST   /api/encounters/:id/start
```

### Session Notes (5 endpoints)
```
POST   /api/notes
GET    /api/notes/:sessionId
GET    /api/notes/:id
PUT    /api/notes/:id
DELETE /api/notes/:id
```

**Total: 79 REST API endpoints**

For complete API documentation, see [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md#api-endpoints)

---

## WebSocket Events Summary

### Connection Events
- `connect` - Client connected
- `disconnect` - Client disconnected
- `join_session` - Join game session room
- `leave_session` - Leave game session room
- `join_campaign` - Join campaign room
- `join_chat` - Join chat room

### Game Events (Broadcast)
- `game_event` - Generic game event
- `DAMAGE_TAKEN` - Character took damage
- `HEALING_RECEIVED` - Character healed
- `SPELL_CAST` - Spell was cast
- `COMBAT_STARTED` - Combat began
- `TURN_CHANGED` - Combat turn changed
- `character_updated` - Character sheet updated

### Messaging Events
- `NEW_MESSAGE` - New private message
- `NEW_GROUP_MESSAGE` - New group message
- `user_typing` - User is typing
- `user_stopped_typing` - User stopped typing
- `reaction_added` - Reaction added to message

### Master Events
- `NPC_ADDED` - NPC added to combat
- `NPC_ADDED_HIDDEN` - Hidden NPC added
- `SECRET_ROLL` - Secret roll made
- `SECRET_ROLL_REVEALED` - Secret roll revealed

For complete WebSocket documentation, see [GAME_SESSION_EVENTS_SYSTEM.md](GAME_SESSION_EVENTS_SYSTEM.md#real-time-synchronization)

---

## Key Calculation Formulas

### Ability Modifiers
```typescript
abilityModifier = Math.floor((abilityScore - 10) / 2)
```

### Proficiency Bonus
```typescript
proficiencyBonus = Math.ceil(totalLevel / 4) + 1
// Level 1-4: +2
// Level 5-8: +3
// Level 9-12: +4
// Level 13-16: +5
// Level 17-20: +6
```

### Skill Bonus
```typescript
skillBonus = abilityModifier + (proficient ? proficiencyBonus : 0) + (expertise ? proficiencyBonus : 0)
```

### Armor Class
```typescript
// Unarmored
AC = 10 + dexterityModifier

// Light Armor
AC = armorBase + dexterityModifier

// Medium Armor
AC = armorBase + Math.min(dexterityModifier, 2)

// Heavy Armor
AC = armorBase

// Shield
AC += 2 (if equipped)
```

### Initiative
```typescript
initiative = dexterityModifier + bonuses
```

### Spell Save DC
```typescript
spellSaveDC = 8 + proficiencyBonus + spellcastingAbilityModifier
```

### Spell Attack Bonus
```typescript
spellAttackBonus = proficiencyBonus + spellcastingAbilityModifier
```

### Hit Points on Level Up
```typescript
// Average (recommended)
hpGain = Math.floor(hitDice / 2) + 1 + constitutionModifier

// Rolled
hpGain = rollDice(hitDice) + constitutionModifier

// Minimum 1
hpGain = Math.max(1, hpGain)
```

### Carrying Capacity
```typescript
carryingCapacity = strengthScore * 15 // pounds
```

For complete calculation documentation, see [ADVANCED_LOGIC_DOCUMENTATION.md](ADVANCED_LOGIC_DOCUMENTATION.md#calculation-logic)

---

## Security Implementation

### Authentication Flow
```
1. User registers/logs in
2. Backend validates credentials
3. Generate JWT access token (15min) + refresh token (7 days)
4. Store refresh token in database
5. Return both tokens to client
6. Client stores access token in memory, refresh in httpOnly cookie
7. Include access token in Authorization header for API requests
8. When access token expires, use refresh token to get new access token
9. On logout, invalidate refresh token
```

### Authorization Levels
```typescript
enum Role {
  USER = 'user',           // Basic authenticated user
  PLAYER = 'player',       // Player in a campaign
  MASTER = 'master',       // Campaign master
  ADMIN = 'admin'          // System administrator
}

// Resource-level permissions
interface Permissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManage: boolean;      // Master-only
}
```

### Input Validation
```typescript
// All DTOs use class-validator
class CreateCharacterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  characterName: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  level: number;

  @IsEnum(AbilityScore)
  spellcastingAbility?: string;
}
```

### Rate Limiting
```typescript
// Global rate limit
@ThrottlerGuard({
  ttl: 60,           // 60 seconds
  limit: 100         // 100 requests
})

// Sensitive endpoints
@ThrottlerGuard({
  ttl: 60,
  limit: 5           // 5 requests per minute
})
```

---

## Testing Strategy

### Unit Tests
```typescript
// Example: Calculation service test
describe('CalculationService', () => {
  it('should calculate ability modifier correctly', () => {
    expect(calculateModifier(10)).toBe(0);
    expect(calculateModifier(15)).toBe(2);
    expect(calculateModifier(8)).toBe(-1);
  });

  it('should calculate proficiency bonus by level', () => {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(9)).toBe(4);
  });
});
```

### Integration Tests
```typescript
// Example: Character API test
describe('Characters API', () => {
  it('should create a character', async () => {
    const response = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${token}`)
      .send(characterData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.characterName).toBe(characterData.characterName);
  });
});
```

### E2E Tests
```typescript
// Example: Playwright test
test('complete character creation flow', async ({ page }) => {
  await page.goto('/characters/new');
  await page.fill('[name="characterName"]', 'Test Character');
  await page.selectOption('[name="race"]', 'Human');
  await page.selectOption('[name="class"]', 'Fighter');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/characters\/[a-z0-9-]+$/);
  await expect(page.locator('h1')).toContainText('Test Character');
});
```

---

## Deployment Guide

### Docker Compose Setup

```yaml
version: '3.8'

services:
  # Backend API
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/dnd
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  # WebSocket Server
  websocket:
    build: ./backend
    command: npm run start:websocket
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis

  # Frontend
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - api

  # Database
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_PASSWORD}

  # Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
      - websocket

volumes:
  mongo_data:
  redis_data:
```

### Environment Variables

```bash
# Backend .env
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://localhost:27017/dnd
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
GOOGLE_SHEETS_API_KEY=your-api-key
SRD_API_URL=https://www.dnd5eapi.co/api

# Frontend .env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://ws.yourdomain.com
VITE_GOOGLE_CLIENT_ID=your-client-id
```

---

## Performance Optimization

### Database Indexing
```typescript
// Critical indexes for performance
db.character_sheets.createIndex({ userId: 1 });
db.character_sheets.createIndex({ campaignId: 1 });
db.game_events.createIndex({ sessionId: 1, timestamp: -1 });
db.game_events.createIndex({ campaignId: 1, timestamp: -1 });
db.messages.createIndex({ campaignId: 1, timestamp: -1 });
db.combat_encounters.createIndex({ sessionId: 1, status: 1 });
```

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
const cacheKey = `character:${characterId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const character = await db.findById(characterId);
await redis.setex(cacheKey, 300, JSON.stringify(character)); // 5 min TTL
return character;
```

### WebSocket Optimization
```typescript
// Batch updates to reduce traffic
class WebSocketBatchService {
  private batchQueue: Map<string, any[]> = new Map();
  private readonly BATCH_INTERVAL = 100; // ms

  queueUpdate(sessionId: string, update: any): void {
    if (!this.batchQueue.has(sessionId)) {
      this.batchQueue.set(sessionId, []);
    }
    this.batchQueue.get(sessionId)!.push(update);
  }

  private flushBatches(): void {
    for (const [sessionId, updates] of this.batchQueue.entries()) {
      if (updates.length > 0) {
        this.wsService.broadcastToSession(sessionId, {
          type: 'BATCH_UPDATE',
          updates
        });
        this.batchQueue.set(sessionId, []);
      }
    }
  }
}
```

---

## Monitoring & Logging

### Logging Setup
```typescript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log all API requests
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
```

### Metrics Collection
```typescript
// Prometheus metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

// Track event metrics
const gameEventCounter = new promClient.Counter({
  name: 'game_events_total',
  help: 'Total number of game events',
  labelNames: ['event_type', 'campaign_id']
});
```

---

## Conclusion

This technical specification provides a complete blueprint for implementing a D&D 5E character sheet web application. The system is designed to be:

- **Scalable**: Handles multiple campaigns and concurrent sessions
- **Real-time**: WebSocket-based instant synchronization
- **Secure**: JWT authentication, role-based access, input validation
- **Extensible**: Custom scripts, external integrations, modular architecture
- **Maintainable**: Clean code, comprehensive tests, detailed documentation

### Next Steps

1. Review all referenced documentation files
2. Set up development environment
3. Follow the phased implementation guide
4. Implement core features first
5. Add real-time features
6. Implement master tools
7. Add advanced features
8. Test thoroughly
9. Deploy to production

### Support & Resources

- **Documentation**: All 8 detailed specification documents
- **Total Lines**: 9,000+ lines of technical documentation
- **API Endpoints**: 79 REST endpoints + WebSocket events
- **Database Tables**: 13 main tables with relationships
- **Event Types**: 30+ game event types
- **Implementation Time**: Estimated 18 weeks for full implementation

For questions or clarifications on any aspect of the system, refer to the specific documentation file covering that topic.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Total Documentation Size:** 9,000+ lines across 8 files  
**Status:** Complete and ready for implementation