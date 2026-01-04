# BETR CAT - Farcaster Mini App

A 3D runner game built as a Farcaster mini app with leaderboard functionality.

## 🎮 Game Features

- **3D Runner Gameplay**: Navigate lanes, collect letters (B-E-T-R), avoid obstacles
- **Farcaster Integration**: Seamless authentication with Farcaster accounts
- **Leaderboard**: Track high scores and compete with other players
- **Daily Limits**: One official attempt per day (with debug mode for testing)

## 🚀 Tech Stack

- **Frontend**: React + Three.js (@react-three/fiber) + Vite
- **Backend**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL
- **Authentication**: Farcaster Mini App SDK

## 📦 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- A Neon PostgreSQL database
- Vercel account (for deployment)

### Local Development

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd betrcat
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Update the values:
   ```env
   DATABASE_URL=postgresql://username:password@hostname/database
   VITE_API_BASE_URL=http://localhost:5173
   ```

3. **Initialize Database**
   
   After setting up your Neon database, initialize the schema by calling:
   ```bash
   # After deploying or running locally, make a POST request to:
   curl -X POST http://localhost:5173/api/init-db
   ```
   
   Or visit the endpoint in your browser after deployment.

4. **Run Development Server**
   ```bash
   npm run dev
   ```

### Deployment to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables in Vercel**
   
   Go to your Vercel project dashboard and add:
   - `DATABASE_URL`: Your Neon database connection string
   - `VITE_API_BASE_URL`: Your Vercel deployment URL (e.g., https://your-app.vercel.app)

5. **Initialize Database Schema**
   
   After deployment, visit or curl:
   ```bash
   curl -X POST https://your-app.vercel.app/api/init-db
   ```

## 🗄️ Database Schema

The app uses three main tables:

### `users`
- `id`: Serial primary key
- `fid`: Farcaster user ID (unique)
- `username`: Farcaster username
- `display_name`: Display name
- `pfp_url`: Profile picture URL
- `created_at`: Account creation timestamp
- `last_seen`: Last activity timestamp

### `game_sessions`
- `id`: Serial primary key
- `user_id`: Foreign key to users
- `score`: Game score
- `distance`: Distance traveled
- `collected_letters`: Array of collected letters
- `completed`: Whether the game was completed
- `played_at`: Game timestamp

## 🎯 API Endpoints

### POST `/api/auth`
Authenticate user and return user data with stats.

**Request:**
```json
{
  "fid": 12345,
  "username": "user",
  "displayName": "User Name",
  "pfpUrl": "https://..."
}
```

**Response:**
```json
{
  "user": { ... },
  "stats": {
    "totalGames": 10,
    "highScore": 5000,
    "completions": 2
  }
}
```

### POST `/api/game-session`
Record a game session.

**Request:**
```json
{
  "fid": 12345,
  "score": 5000,
  "distance": 150,
  "collectedLetters": ["B", "E", "T", "R"],
  "completed": true
}
```

### GET `/api/leaderboard`
Get leaderboard data.

**Query Parameters:**
- `limit`: Number of entries (default: 100)
- `fid`: Optional user FID to get user rank

**Response:**
```json
{
  "leaderboard": [
    {
      "fid": 12345,
      "username": "user",
      "displayName": "User Name",
      "pfpUrl": "https://...",
      "highScore": 5000,
      "totalGames": 10,
      "rank": 1
    }
  ],
  "userRank": { ... },
  "total": 100
}
```

### POST `/api/init-db`
Initialize database schema (run once after deployment).

## 🎮 Game Controls

- **Arrow Keys / WASD**: Move between lanes
- **Space**: Jump
- **Objective**: Collect all letters (B-E-T-R) to win
- **Avoid**: Red obstacles that reduce lives

## 📱 Farcaster Mini App Integration

The app uses the `@farcaster/miniapp-sdk` to:
1. Authenticate users automatically when opened in Farcaster
2. Call `sdk.actions.ready()` to reveal content after initialization
3. Access user profile data (FID, username, display name, profile picture)

## 🔧 Development Notes

- The app includes a debug mode that allows unlimited plays (bypassing daily limits)
- User authentication happens automatically on app load
- Game sessions are recorded automatically on game over or victory
- Leaderboard is fetched and cached on authentication

## 📄 License

Apache-2.0

## 🤝 Contributing

This is a mini app game. Feel free to fork and customize!
