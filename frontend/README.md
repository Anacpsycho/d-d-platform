# D&D 5E Character Sheet - Frontend

React-based frontend application for managing D&D 5th Edition character sheets with real-time updates and responsive design.

## Features

- ✅ **Authentication System** - Login, Register, Password Reset
- ✅ **Character Management** - Create, edit, and delete characters
- ✅ **Complete Character Sheet** - All D&D 5E stats, skills, spells, equipment
- ✅ **Real-time Updates** - Live HP tracking, spell slots, conditions
- ✅ **Responsive Design** - Mobile-first, works on all devices
- ✅ **State Management** - Zustand for efficient state handling
- ✅ **API Integration** - Full REST API integration with backend

## Tech Stack

- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI 5
- **State Management**: Zustand
- **Routing**: React Router v6
- **API Client**: Axios with interceptors
- **Build Tool**: Vite
- **Forms**: React Hook Form

## Prerequisites

- Node.js 18+ and npm
- Backend API running (see backend README)

## Installation

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
```

Edit `.env` and set your API URL:
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

3. **Start development server**:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── character/       # Character sheet components
│   │   │   ├── AbilityScores/
│   │   │   ├── Skills/
│   │   │   ├── Combat/
│   │   │   ├── Spells/
│   │   │   ├── Equipment/
│   │   │   └── Features/
│   │   └── common/          # Common components
│   │       ├── Layout.tsx
│   │       └── PrivateRoute.tsx
│   ├── pages/               # Page components
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── PasswordReset/
│   │   ├── Dashboard/
│   │   └── CharacterSheet/
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCharacter.ts
│   │   └── useApi.ts
│   ├── services/            # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── character.service.ts
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts
│   │   └── characterStore.ts
│   ├── types/               # TypeScript types
│   │   ├── auth.types.ts
│   │   └── character.types.ts
│   ├── styles/              # Global styles
│   │   └── theme.ts
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Authentication
- JWT-based authentication with automatic token refresh
- Protected routes with automatic redirect
- Persistent login state

### Character Sheet
- **Ability Scores**: All 6 core abilities with modifiers
- **Skills**: 18 skills with proficiency tracking
- **Combat**: HP tracking, AC, initiative, death saves
- **Spells**: Spell slots, known spells, prepared spells
- **Equipment**: Inventory management, currency, attacks
- **Features**: Class features, racial traits, feats

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimized layouts
- Touch-friendly interface
- Adaptive navigation

### State Management
- Centralized state with Zustand
- Automatic API synchronization
- Optimistic updates
- Error handling

## API Integration

The frontend communicates with the backend API:

- **Base URL**: Configured via `VITE_API_URL`
- **Authentication**: JWT tokens in Authorization header
- **Auto-refresh**: Automatic token refresh on 401 errors
- **Error Handling**: Centralized error handling with user feedback

## Development

### Adding a New Component

1. Create component file in appropriate directory
2. Export as default
3. Add TypeScript types
4. Use Material-UI components for consistency

### Adding a New API Endpoint

1. Add service method in appropriate service file
2. Add TypeScript types if needed
3. Update store if state management needed
4. Create custom hook if complex logic required

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Docker Build

```bash
docker build -t dnd-frontend .
docker run -p 80:80 dnd-frontend
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000/api` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:3000` |

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### TypeScript Errors
The TypeScript errors you see are expected until dependencies are installed:
```bash
npm install
```

### API Connection Issues
1. Verify backend is running
2. Check `VITE_API_URL` in `.env`
3. Check browser console for CORS errors

### Build Errors
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`

## Contributing

1. Follow TypeScript best practices
2. Use Material-UI components
3. Maintain responsive design
4. Add proper error handling
5. Write clear component documentation

## License

MIT License - See LICENSE file for details