/**
 * Game session tracking API endpoint
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from './db.js';

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
    console.log('[Game Session API] Received game session request');
    console.log('[Game Session API] Request body:', JSON.stringify(req.body));
    
    if (!sql) {
      console.error('[Game Session API] Database not configured');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { fid, score, distance, collectedLetters, completed } = req.body;

    if (!fid || score === undefined) {
      console.error('[Game Session API] Missing required fields:', { fid, score });
      return res.status(400).json({ error: 'Missing required fields: fid, score' });
    }

    console.log('[Game Session API] Looking up user with fid:', fid);

    // Get user ID from fid
    const userResult = await sql`
      SELECT id FROM users WHERE fid = ${fid}
    `;

    if (userResult.length === 0) {
      console.error('[Game Session API] User not found for fid:', fid);
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult[0].id;
    console.log('[Game Session API] User found with id:', userId);

    // Insert game session
    console.log('[Game Session API] Inserting game session...');
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

    console.log('[Game Session API] Game session recorded:', result[0].id);

    return res.status(201).json({
      session: result[0],
      message: 'Game session recorded successfully'
    });
  } catch (error) {
    console.error('[Game Session API] Error:', error);
    if (error instanceof Error) {
      console.error('[Game Session API] Error details:', {
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
