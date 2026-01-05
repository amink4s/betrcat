/**
 * Database initialization endpoint (run once to set up tables)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeDatabase } from './db.js';

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
    // Log environment check (without exposing the actual URL)
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      return res.status(500).json({ 
        error: 'Database configuration error',
        details: 'DATABASE_URL environment variable is not configured'
      });
    }
    
    console.log('Starting database initialization...');
    await initializeDatabase();
    console.log('Database initialization completed');
    
    return res.status(200).json({ 
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error stack:', errorStack);
    
    return res.status(500).json({ 
      error: 'Failed to initialize database',
      details: errorMessage
    });
  }
}
