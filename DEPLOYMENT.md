# Deployment Guide

## Quick Start - Deploying to Vercel with Neon

### Step 1: Set up Neon Database

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy your connection string (it looks like: `postgresql://username:password@hostname/database`)

### Step 2: Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Configure environment variables in Vercel:
   - `DATABASE_URL`: Your Neon connection string
   - `VITE_API_BASE_URL`: Will be auto-filled with your deployment URL after first deploy

4. Deploy the project

### Step 3: Initialize Database

After your first deployment:

```bash
curl -X POST https://your-app.vercel.app/api/init-db
```

This creates the necessary tables in your Neon database.

### Step 4: Update Environment Variables

1. Go back to Vercel project settings
2. Add/update `VITE_API_BASE_URL` with your full deployment URL (e.g., `https://your-app.vercel.app`)
3. Redeploy to apply changes

### Step 5: Configure Farcaster

1. Register your app as a Farcaster mini app
2. Set your app URL to your Vercel deployment URL
3. Test in Farcaster!

## Local Testing

For local development without Farcaster:

1. Set up `.env`:
   ```env
   DATABASE_URL=your_neon_connection_string
   VITE_API_BASE_URL=http://localhost:5173
   ```

2. Initialize local database:
   ```bash
   npm run dev
   # Then in another terminal:
   curl -X POST http://localhost:5173/api/init-db
   ```

3. The app will work without Farcaster auth (will show as guest user)

## Troubleshooting

### "User not found" errors
- Make sure you've initialized the database with `/api/init-db`
- Check that DATABASE_URL is correctly set

### Leaderboard not showing
- Verify API endpoints are accessible
- Check browser console for CORS errors
- Ensure VITE_API_BASE_URL is correctly set

### Farcaster auth not working
- Verify you're testing in the Farcaster app, not a regular browser
- Check that your app is properly registered as a Farcaster mini app
- Ensure `sdk.actions.ready()` is being called successfully

## Vercel Configuration

The `vercel.json` file handles:
- API routing to serverless functions
- CORS headers for API endpoints
- Environment variable mapping

No additional configuration should be needed.

## Database Migrations

If you need to modify the database schema:

1. Update `api/db.ts` with your new schema
2. Either:
   - Drop and recreate tables (data loss!) by calling `/api/init-db` again
   - Or manually run SQL migrations in Neon console

## Performance Tips

- Neon free tier provides good performance for small games
- Consider adding indexes if you have many users (already included in schema)
- Vercel edge functions provide low latency globally

## Monitoring

Monitor your app:
- Vercel Dashboard: View logs and analytics
- Neon Dashboard: Monitor database queries and performance
- Browser DevTools: Check API responses and errors
