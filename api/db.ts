/**
 * Database utilities for Neon PostgreSQL
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = neon(process.env.DATABASE_URL);

export interface User {
  id: number;
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  created_at: Date;
  last_seen: Date;
}

export interface GameSession {
  id: number;
  user_id: number;
  score: number;
  distance: number;
  collected_letters: string[];
  completed: boolean;
  played_at: Date;
}

export interface LeaderboardEntry {
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  high_score: number;
  total_games: number;
  rank: number;
}

// Initialize database schema
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        fid INTEGER UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        pfp_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create game_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL DEFAULT 0,
        distance INTEGER NOT NULL DEFAULT 0,
        collected_letters TEXT[] DEFAULT '{}',
        completed BOOLEAN DEFAULT FALSE,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better query performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id 
      ON game_sessions(user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_sessions_score 
      ON game_sessions(score DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_fid 
      ON users(fid)
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
