/**
 * Authentication API endpoint for Farcaster users
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Auth API] Received auth request');
    console.log('[Auth API] Request body:', JSON.stringify(req.body));
    
    if (!sql) {
      console.error('[Auth API] Database not configured - DATABASE_URL missing');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { fid, username, displayName, pfpUrl } = req.body;

    if (!fid || !username) {
      console.error('[Auth API] Missing required fields:', { fid, username });
      return res.status(400).json({ error: 'Missing required fields: fid, username' });
    }
    
    console.log('[Auth API] Processing user:', { fid, username, displayName, hasPfpUrl: !!pfpUrl });

    // Upsert user (insert or update if exists)
    console.log('[Auth API] Upserting user to database...');
    const result = await sql`
      INSERT INTO users (fid, username, display_name, pfp_url, last_seen)
      VALUES (${fid}, ${username}, ${displayName || username}, ${pfpUrl || null}, NOW())
      ON CONFLICT (fid) 
      DO UPDATE SET 
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        pfp_url = EXCLUDED.pfp_url,
        last_seen = NOW()
      RETURNING id, fid, username, display_name, pfp_url, created_at, last_seen
    `;

    const user = result[0];
    console.log('[Auth API] User upserted successfully:', { id: user.id, fid: user.fid, username: user.username });

    // Get user stats
    console.log('[Auth API] Fetching user stats...');
    const stats = await sql`
      SELECT 
        COUNT(*) as total_games,
        MAX(score) as high_score,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completions
      FROM game_sessions
      WHERE user_id = ${user.id}
    `;

    console.log('[Auth API] User stats retrieved:', stats[0]);
    console.log('[Auth API] Auth request completed successfully');

    return res.status(200).json({
      user,
      stats: {
        totalGames: parseInt(stats[0].total_games || '0'),
        highScore: parseInt(stats[0].high_score || '0'),
        completions: parseInt(stats[0].completions || '0')
      }
    });
  } catch (error) {
    console.error('[Auth API] Error during authentication:', error);
    if (error instanceof Error) {
      console.error('[Auth API] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
