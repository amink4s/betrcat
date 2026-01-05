/**
 * Game session tracking API endpoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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

    const { fid, score, distance, collectedLetters, completed } = req.body;

    if (!fid || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields: fid, score' });
    }

    // Get user ID from fid
    const userResult = await sql`
      SELECT id FROM users WHERE fid = ${fid}
    `;

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult[0].id;

    // Insert game session
    const result = await sql`
      INSERT INTO game_sessions (
        user_id, 
        score, 
        distance, 
        collected_letters, 
        completed
      )
      VALUES (
        ${userId}, 
        ${score}, 
        ${distance || 0}, 
        ${collectedLetters || []}, 
        ${completed || false}
      )
      RETURNING id, score, distance, collected_letters, completed, played_at
    `;

    return res.status(201).json({
      session: result[0],
      message: 'Game session recorded successfully'
    });
  } catch (error) {
    console.error('Game session error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
