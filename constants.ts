
export const SCREEN_WIDTH = 640;
export const SCREEN_HEIGHT = 480;

// 0: empty space, >0: wall with color index
export const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 2, 2, 0, 3, 0, 0, 3, 0, 2, 2, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 3, 3, 3, 3, 0, 0, 0, 2, 0, 1],
  [1, 0, 2, 0, 4, 0, 0, 0, 0, 0, 0, 4, 0, 2, 0, 1],
  [1, 0, 2, 0, 4, 0, 0, 1, 1, 0, 0, 4, 0, 2, 0, 1],
  [1, 0, 0, 0, 4, 4, 4, 1, 1, 4, 4, 4, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 1],
  [1, 0, 3, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 3, 0, 1],
  [1, 0, 3, 0, 0, 3, 0, 4, 4, 0, 3, 0, 0, 3, 0, 1],
  [1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
  [1, 0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 2, 2, 2, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const PLAYER_START_X = 8;
export const PLAYER_START_Y = 14;
export const PLAYER_START_ANGLE = -Math.PI / 2;
export const PLAYER_START_HEALTH = 100;
export const PLAYER_RADIUS = 0.2;

export const FOV = Math.PI / 3; // 60 degrees
export const MOVE_SPEED = 0.05;
export const TURN_SPEED = 0.03;
export const PLAYER_INVINCIBILITY_MS = 1000;

export const PROJECTILE_SPEED = 0.2;
export const PROJECTILE_COLOR = '#facc15'; // yellow-400
export const FIRE_RATE_MS = 300;
export const PROJECTILE_MAX_BOUNCES = 2;
export const PROJECTILE_DAMAGE = 35;

export const EXPLOSION_PARTICLE_COUNT = 20;
export const EXPLOSION_PARTICLE_SPEED = 0.03;
export const EXPLOSION_PARTICLE_LIFESPAN_MS = 300;
export const EXPLOSION_PARTICLE_COLOR = '#fbbf24'; // amber-400

export const ENEMY_SPAWN_LOCATIONS = [
    [3.5, 3.5],
    [5.5, 8.5],
    [12.5, 4.5],
    [13.5, 12.5],
];
export const ENEMY_HEALTH = 100;
export const ENEMY_RADIUS = 0.4;
export const ENEMY_COLOR = '#8b5cf6'; // violet-500
export const ENEMY_SHADOW_COLOR = '#6d28d9'; // violet-700
export const ENEMY_DAMAGE = 10;
export const ENEMY_MOVE_SPEED = 0.02;
export const ENEMY_AGGRO_RADIUS = 8;


export const WALL_COLORS: { [key: number]: { base: string; shadow: string } } = {
  1: { base: '#6b7280', shadow: '#4b5563' }, // Gray
  2: { base: '#b91c1c', shadow: '#7f1d1d' }, // Red
  3: { base: '#166534', shadow: '#14532d' }, // Green
  4: { base: '#1d4ed8', shadow: '#1e3a8a' }, // Blue
};

export const CEILING_COLOR = "#374151"; // Gray-700
export const FLOOR_COLOR = "#1f2937"; // Gray-800

// Minimap
export const MINIMAP_SCALE = 8;
export const MINIMAP_WALL_COLOR = '#6b7280'; // Gray
export const MINIMAP_FLOOR_COLOR = '#1f2937'; // Gray-800
export const MINIMAP_PLAYER_COLOR = '#facc15'; // yellow-400