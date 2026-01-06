/**
 * Leaderboard API endpoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[Leaderboard API] Received leaderboard request');
    
    if (!sql) {
      console.error('[Leaderboard API] Database not configured');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { limit = '100', fid } = req.query;
    const limitNum = parseInt(limit as string, 10);

    console.log('[Leaderboard API] Fetching top', limitNum, 'players, fid filter:', fid || 'none');

    // Get top players by high score
    const leaderboard = await sql`
      SELECT 
        u.fid,
        u.username,
        u.display_name,
        u.pfp_url,
        MAX(gs.score) as high_score,
        COUNT(gs.id) as total_games,
        ROW_NUMBER() OVER (ORDER BY MAX(gs.score) DESC) as rank
      FROM users u
      INNER JOIN game_sessions gs ON u.id = gs.user_id
      GROUP BY u.id, u.fid, u.username, u.display_name, u.pfp_url
      ORDER BY high_score DESC
      LIMIT ${limitNum}
    `;

    console.log('[Leaderboard API] Retrieved', leaderboard.length, 'leaderboard entries');

    let userRank = null;
    
    // If fid is provided, get the user's rank if they're not in top results
    if (fid) {
      console.log('[Leaderboard API] Fetching specific user rank for fid:', fid);
      const userRankResult = await sql`
        WITH ranked_users AS (
          SELECT 
            u.fid,
            u.username,
            u.display_name,
            u.pfp_url,
            MAX(gs.score) as high_score,
            COUNT(gs.id) as total_games,
            ROW_NUMBER() OVER (ORDER BY MAX(gs.score) DESC) as rank
          FROM users u
          INNER JOIN game_sessions gs ON u.id = gs.user_id
          GROUP BY u.id, u.fid, u.username, u.display_name, u.pfp_url
        )
        SELECT * FROM ranked_users
        WHERE fid = ${fid}
      `;

      if (userRankResult.length > 0) {
        console.log('[Leaderboard API] User rank found:', userRankResult[0].rank);
        userRank = {
          fid: userRankResult[0].fid,
          username: userRankResult[0].username,
          displayName: userRankResult[0].display_name,
          pfpUrl: userRankResult[0].pfp_url,
          highScore: parseInt(userRankResult[0].high_score),
          totalGames: parseInt(userRankResult[0].total_games),
          rank: parseInt(userRankResult[0].rank)
        };
      } else {
        console.log('[Leaderboard API] User rank not found for fid:', fid);
      }
    }

    // Format the leaderboard data
    const formattedLeaderboard = leaderboard.map((entry) => ({
      fid: entry.fid,
      username: entry.username,
      displayName: entry.display_name,
      pfpUrl: entry.pfp_url,
      highScore: parseInt(entry.high_score),
      totalGames: parseInt(entry.total_games),
      rank: parseInt(entry.rank)
    }));

    console.log('[Leaderboard API] Returning leaderboard with', formattedLeaderboard.length, 'entries');

    return res.status(200).json({
      leaderboard: formattedLeaderboard,
      userRank,
      total: formattedLeaderboard.length
    });
  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    if (error instanceof Error) {
      console.error('[Leaderboard API] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
