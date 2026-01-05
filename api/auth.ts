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
    if (!sql) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { fid, username, displayName, pfpUrl } = req.body;

    if (!fid || !username) {
      return res.status(400).json({ error: 'Missing required fields: fid, username' });
    }

    // Upsert user (insert or update if exists)
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

    // Get user stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_games,
        MAX(score) as high_score,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completions
      FROM game_sessions
      WHERE user_id = ${user.id}
    `;

    return res.status(200).json({
      user,
      stats: {
        totalGames: parseInt(stats[0].total_games || '0'),
        highScore: parseInt(stats[0].high_score || '0'),
        completions: parseInt(stats[0].completions || '0')
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
