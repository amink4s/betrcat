# 🚀 Quick Deploy Guide

## Prerequisites Checklist
- [ ] Neon PostgreSQL account created
- [ ] Neon database connection string copied
- [ ] Vercel account created
- [ ] Code pushed to GitHub

## 5-Minute Deploy

### 1️⃣ Create .env file
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

### 2️⃣ Deploy to Vercel
```bash
vercel --prod
```

### 3️⃣ Add Environment Variables in Vercel Dashboard
- `DATABASE_URL`: Your Neon connection string
- `VITE_API_BASE_URL`: Your Vercel app URL

### 4️⃣ Initialize Database
```bash
curl -X POST https://your-app.vercel.app/api/init-db
```

### 5️⃣ Test Your App
Open your Vercel URL in a browser to test!

## Important URLs After Deploy

- **App URL**: `https://your-app.vercel.app`
- **Init DB**: `https://your-app.vercel.app/api/init-db` (POST)
- **Leaderboard API**: `https://your-app.vercel.app/api/leaderboard`
- **Auth API**: `https://your-app.vercel.app/api/auth` (POST)

## Local Development

```bash
# Install dependencies (already done)
npm install

# Create .env with your Neon DATABASE_URL
cp .env.example .env

# Run dev server
npm run dev

# Initialize local DB (in another terminal)
curl -X POST http://localhost:5173/api/init-db

# Open http://localhost:5173
```

## Testing API Endpoints Locally

```bash
# Initialize database
curl -X POST http://localhost:5173/api/init-db

# Test auth (creates user)
curl -X POST http://localhost:5173/api/auth \
  -H "Content-Type: application/json" \
  -d '{"fid": 123, "username": "testuser", "displayName": "Test User"}'

# Get leaderboard
curl http://localhost:5173/api/leaderboard

# Record game session
curl -X POST http://localhost:5173/api/game-session \
  -H "Content-Type: application/json" \
  -d '{"fid": 123, "score": 5000, "distance": 100, "collectedLetters": ["B","E","T","R"], "completed": true}'
```

## Troubleshooting

**Database errors?**
- Check DATABASE_URL is correct in Vercel environment variables
- Make sure you called `/api/init-db`

**Leaderboard not loading?**
- Check browser console for errors
- Verify VITE_API_BASE_URL is set correctly
- Ensure CORS headers are working (check Network tab)

**Farcaster auth not working?**
- Must be opened in Farcaster app, not regular browser
- Check that your app is registered with Farcaster
- Verify SDK is properly initialized in App.tsx

## Environment Variables Reference

### Development (.env file)
```env
DATABASE_URL=postgresql://user:pass@host/db
VITE_API_BASE_URL=http://localhost:5173
```

### Production (Vercel Dashboard)
```
DATABASE_URL=postgresql://user:pass@host/db
VITE_API_BASE_URL=https://your-app.vercel.app
```

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created and linked
- [ ] Environment variables added in Vercel
- [ ] First deployment successful
- [ ] Database initialized (`/api/init-db`)
- [ ] VITE_API_BASE_URL updated with production URL
- [ ] App redeployed after env variable update
- [ ] Tested in browser
- [ ] Registered with Farcaster
- [ ] Tested in Farcaster app

## Need Help?

Check these files:
- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
- [SETUP_COMPLETE.md](SETUP_COMPLETE.md) - What was built

## Database Schema

Tables created by `/api/init-db`:

**users**
- id, fid (unique), username, display_name, pfp_url
- created_at, last_seen

**game_sessions**
- id, user_id, score, distance
- collected_letters[], completed
- played_at

---

**Ready to deploy? Run: `vercel --prod`** 🚀
