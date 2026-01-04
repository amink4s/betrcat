/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  LOCKED = 'LOCKED'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  LOGO = 'LOGO',
  LETTER = 'LETTER'
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  prevZ: number; // For robust collision detection at high speeds
  active: boolean;
  value?: string; 
  color?: string;
  targetIndex?: number;
  imageUrl?: string; 
}

export const LANE_WIDTH = 2.4; // Slightly wider lanes for better movement
export const JUMP_HEIGHT = 2.8;
export const RUN_SPEED_BASE = 32.0; // Increased for short attention spans
export const SPAWN_DISTANCE = 150;
export const REMOVE_DISTANCE = 30;

export const TARGET_WORD = ['B', 'E', 'T', 'R'];

export const CASINO_COLORS = [
    '#00ffff', // B (Cyan)
    '#ff0033', // E (Red)
    '#00ffff', // T (Cyan)
    '#ff0033', // R (Red)
];

export const LOGO_IMAGE_URL = 'https://betrmint.fun/images/logo.png';