/**
 * Leaderboard API endpoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

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
    const { limit = '100', fid } = req.query;
    const limitNum = parseInt(limit as string, 10);

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

    let userRank = null;
    
    // If fid is provided, get the user's rank if they're not in top results
    if (fid) {
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
        userRank = {
          fid: userRankResult[0].fid,
          username: userRankResult[0].username,
          displayName: userRankResult[0].display_name,
          pfpUrl: userRankResult[0].pfp_url,
          highScore: parseInt(userRankResult[0].high_score),
          totalGames: parseInt(userRankResult[0].total_games),
          rank: parseInt(userRankResult[0].rank)
        };
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

    return res.status(200).json({
      leaderboard: formattedLeaderboard,
      userRank,
      total: formattedLeaderboard.length
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
