
import React, { useRef, useEffect } from 'react';
import {
  MAP,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  FOV,
  MOVE_SPEED,
  TURN_SPEED,
  WALL_COLORS,
  CEILING_COLOR,
  FLOOR_COLOR,
  PLAYER_START_X,
  PLAYER_START_Y,
  PLAYER_START_ANGLE,
  PLAYER_START_HEALTH,
  PLAYER_RADIUS,
  PLAYER_INVINCIBILITY_MS,
  PROJECTILE_SPEED,
  PROJECTILE_COLOR,
  FIRE_RATE_MS,
  MINIMAP_SCALE,
  MINIMAP_WALL_COLOR,
  MINIMAP_FLOOR_COLOR,
  MINIMAP_PLAYER_COLOR,
  PROJECTILE_MAX_BOUNCES,
  EXPLOSION_PARTICLE_COUNT,
  EXPLOSION_PARTICLE_SPEED,
  EXPLOSION_PARTICLE_LIFESPAN_MS,
  EXPLOSION_PARTICLE_COLOR,
  ENEMY_SPAWN_LOCATIONS,
  ENEMY_HEALTH,
  ENEMY_RADIUS,
  ENEMY_COLOR,
  ENEMY_SHADOW_COLOR,
  PROJECTILE_DAMAGE,
  ENEMY_DAMAGE,
  ENEMY_MOVE_SPEED,
  ENEMY_AGGRO_RADIUS,
} from '../constants';

interface Player {
  x: number;
  y: number;
  angle: number;
  health: number;
}

interface Keys {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  fire: boolean;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  angle: number;
  bounces: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  startTime: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
}

type Rect = { x: number; y: number; width: number; height: number };

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>({ x: 0, y: 0, angle: 0, health: 0 });
  const keysRef = useRef<Keys>({ forward: false, backward: false, left: false, right: false, fire: false });
  const animationFrameId = useRef<number | null>(null);

  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const lastFireTimeRef = useRef<number>(0);
  const lastDamageTimeRef = useRef<number>(0);
  const nextId = useRef<number>(0);
  const zBufferRef = useRef<number[]>(new Array(SCREEN_WIDTH).fill(0));
  
  const isGameOver = useRef(false);
  const restartButtonRectRef = useRef<Rect | null>(null);

  const resetGame = () => {
    playerRef.current = {
      x: PLAYER_START_X,
      y: PLAYER_START_Y,
      angle: PLAYER_START_ANGLE,
      health: PLAYER_START_HEALTH,
    };
    enemiesRef.current = ENEMY_SPAWN_LOCATIONS.map(([x, y]) => ({
      id: nextId.current++,
      x,
      y,
      health: ENEMY_HEALTH,
    }));
    projectilesRef.current = [];
    particlesRef.current = [];
    isGameOver.current = false;
    lastDamageTimeRef.current = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.forward = true;
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.backward = true;
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.right = true;
      if (e.code === 'Space') keysRef.current.fire = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.forward = false;
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.backward = false;
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.right = false;
      if (e.code === 'Space') keysRef.current.fire = false;
    };
    
    const handleCanvasClick = (e: MouseEvent) => {
      if (!isGameOver.current || !restartButtonRectRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const button = restartButtonRectRef.current;
      if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
        resetGame();
      }
    };
    
    const canvas = canvasRef.current;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas?.addEventListener('click', handleCanvasClick);
    
    resetGame();
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas?.removeEventListener('click', handleCanvasClick);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePlayer = () => {
    const player = playerRef.current;
    const keys = keysRef.current;
    const now = performance.now();

    if (keys.left) player.angle -= TURN_SPEED;
    if (keys.right) player.angle += TURN_SPEED;
    
    let dx = 0;
    let dy = 0;

    if (keys.forward) {
        dx += Math.cos(player.angle) * MOVE_SPEED;
        dy += Math.sin(player.angle) * MOVE_SPEED;
    }
    if (keys.backward) {
        dx -= Math.cos(player.angle) * MOVE_SPEED;
        dy -= Math.sin(player.angle) * MOVE_SPEED;
    }

    const newX = player.x + dx;
    const newY = player.y + dy;
    
    if (MAP[Math.floor(player.y)][Math.floor(newX)] === 0) {
        player.x = newX;
    }
    if (MAP[Math.floor(newY)][Math.floor(player.x)] === 0) {
        player.y = newY;
    }

    // Check for enemy collisions
    if (now - lastDamageTimeRef.current > PLAYER_INVINCIBILITY_MS) {
        for (const enemy of enemiesRef.current) {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < PLAYER_RADIUS + ENEMY_RADIUS) {
                player.health -= ENEMY_DAMAGE;
                lastDamageTimeRef.current = now;
                if (player.health <= 0) {
                    player.health = 0;
                    isGameOver.current = true;
                }
                break;
            }
        }
    }
  };

  const hasLineOfSight = (x1: number, y1: number, x2: number, y2: number): boolean => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const stepCount = Math.floor(distance / 0.1);
    if (stepCount === 0) return true;
  
    const stepX = dx / distance * 0.1;
    const stepY = dy / distance * 0.1;
  
    let currentX = x1;
    let currentY = y1;
  
    for (let i = 0; i < stepCount; i++) {
      currentX += stepX;
      currentY += stepY;
      if (MAP[Math.floor(currentY)]?.[Math.floor(currentX)] > 0) {
        return false;
      }
    }
    return true;
  };

  const updateEnemies = () => {
    const player = playerRef.current;
    for (const enemy of enemiesRef.current) {
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

      if (dist < ENEMY_AGGRO_RADIUS && hasLineOfSight(enemy.x, enemy.y, player.x, player.y)) {
        if (dist > ENEMY_RADIUS + PLAYER_RADIUS) {
          const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
          const dx = Math.cos(angle) * ENEMY_MOVE_SPEED;
          const dy = Math.sin(angle) * ENEMY_MOVE_SPEED;

          const newX = enemy.x + dx;
          const newY = enemy.y + dy;

          if (MAP[Math.floor(enemy.y)][Math.floor(newX)] === 0) {
            enemy.x = newX;
          }
          if (MAP[Math.floor(newY)][Math.floor(enemy.x)] === 0) {
            enemy.y = newY;
          }
        }
      }
    }
  };

  const handleFire = () => {
    if (!keysRef.current.fire) return;

    const now = performance.now();
    if (now - lastFireTimeRef.current > FIRE_RATE_MS) {
      lastFireTimeRef.current = now;
      const player = playerRef.current;
      projectilesRef.current.push({
        id: nextId.current++,
        x: player.x,
        y: player.y,
        angle: player.angle,
        bounces: 0,
      });
    }
  };
  
  const createExplosion = (x: number, y: number, count = EXPLOSION_PARTICLE_COUNT) => {
    const now = performance.now();
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = Math.random() * EXPLOSION_PARTICLE_SPEED;
      particlesRef.current.push({
        id: nextId.current++,
        x: x,
        y: y,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        startTime: now,
      });
    }
  };

  const updateGameObjects = () => {
    const now = performance.now();
    const nextProjectiles: Projectile[] = [];

    projectilesLoop: for (const proj of projectilesRef.current) {
      const prevX = proj.x;
      const prevY = proj.y;
      const newX = proj.x + Math.cos(proj.angle) * PROJECTILE_SPEED;
      const newY = proj.y + Math.sin(proj.angle) * PROJECTILE_SPEED;

      for (const enemy of enemiesRef.current) {
        const dist = Math.hypot(newX - enemy.x, newY - enemy.y);
        if (dist < ENEMY_RADIUS) {
          enemy.health -= PROJECTILE_DAMAGE;
          createExplosion(newX, newY);
          continue projectilesLoop;
        }
      }

      const mapX = Math.floor(newX);
      const mapY = Math.floor(newY);
      if (MAP[mapY]?.[mapX] > 0) {
        if (proj.bounces < PROJECTILE_MAX_BOUNCES) {
          proj.bounces++;
          proj.x = prevX;
          proj.y = prevY;

          const prevMapX = Math.floor(prevX);
          const prevMapY = Math.floor(prevY);

          if (mapX !== prevMapX) proj.angle = Math.PI - proj.angle;
          if (mapY !== prevMapY) proj.angle = -proj.angle;
          
          nextProjectiles.push(proj);
        } else {
          createExplosion(newX, newY);
        }
      } else {
        proj.x = newX;
        proj.y = newY;
        nextProjectiles.push(proj);
      }
    }
    projectilesRef.current = nextProjectiles;
    
    enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (enemy.health <= 0) {
            createExplosion(enemy.x, enemy.y, EXPLOSION_PARTICLE_COUNT * 2);
            return false;
        }
        return true;
    });

    particlesRef.current = particlesRef.current.filter(
      (p) => now - p.startTime < EXPLOSION_PARTICLE_LIFESPAN_MS
    );
    for (const p of particlesRef.current) {
      p.x += p.dx;
      p.y += p.dy;
    }
  };
  
  const renderSprites = (ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current;
    const zBuffer = zBufferRef.current;

    const sprites = [
      ...projectilesRef.current.map(p => ({ ...p, type: 'projectile' as const })),
      ...particlesRef.current.map(p => ({ ...p, type: 'particle' as const })),
      ...enemiesRef.current.map(e => ({ ...e, type: 'enemy' as const })),
    ];

    sprites.sort((a, b) => {
      const distA = Math.hypot(a.x - player.x, a.y - player.y);
      const distB = Math.hypot(b.x - player.x, b.y - player.y);
      return distB - distA;
    });

    for (const sprite of sprites) {
      const relX = sprite.x - player.x;
      const relY = sprite.y - player.y;

      const spriteDist = Math.hypot(relX, relY);
      if (spriteDist < 0.2) continue;

      const spriteAngle = Math.atan2(relY, relX);
      let angleDiff = spriteAngle - player.angle;

      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      
      const isVisible = Math.abs(angleDiff) < FOV / 2 + 0.2;
      if (!isVisible) continue;

      const correctedDist = spriteDist * Math.cos(angleDiff);
      const screenX = Math.tan(angleDiff) * (SCREEN_WIDTH / 2) / Math.tan(FOV / 2) + SCREEN_WIDTH / 2;
      
      const spriteHeight = Math.floor(SCREEN_HEIGHT / correctedDist);
      const spriteWidth = spriteHeight;
      const screenY = SCREEN_HEIGHT / 2;

      const screenXInt = Math.floor(screenX);
      if (screenXInt < 0 || screenXInt >= SCREEN_WIDTH || correctedDist > zBuffer[screenXInt]) {
        continue;
      }
      
      if (sprite.type === 'projectile') {
        ctx.fillStyle = PROJECTILE_COLOR;
        ctx.beginPath();
        ctx.arc(screenX, screenY, spriteWidth / 10, 0, 2 * Math.PI);
        ctx.fill();
      } else if (sprite.type === 'particle') {
        const now = performance.now();
        const life = (now - sprite.startTime) / EXPLOSION_PARTICLE_LIFESPAN_MS;
        if (life > 1) continue;

        ctx.fillStyle = EXPLOSION_PARTICLE_COLOR;
        ctx.globalAlpha = 1 - life;
        
        const particleSize = (spriteWidth / 15) * (1 - life);
        if (particleSize <= 0) continue;

        ctx.beginPath();
        ctx.arc(screenX, screenY, particleSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1;
      } else if (sprite.type === 'enemy') {
        const healthBarWidth = spriteWidth * 0.8;
        const healthBarHeight = spriteHeight * 0.1;
        const healthBarY = screenY - spriteHeight / 2 - healthBarHeight * 1.5;
        
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(screenX - healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);

        const healthPercentage = sprite.health / ENEMY_HEALTH;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(screenX - healthBarWidth / 2, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);

        const radius = spriteWidth / 2.5;
        ctx.fillStyle = ENEMY_COLOR;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = ENEMY_SHADOW_COLOR;
        ctx.lineWidth = Math.max(1, spriteWidth / 20);
        ctx.stroke();
      }
    }
  };

  const renderMinimap = (ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current;
    const mapWidth = MAP[0].length;
    const mapHeight = MAP.length;
    
    const minimapWidth = mapWidth * MINIMAP_SCALE;
    const minimapHeight = mapHeight * MINIMAP_SCALE;
    const minimapX = SCREEN_WIDTH - minimapWidth - 10;
    const minimapY = 10;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(minimapX - 2, minimapY - 2, minimapWidth + 4, minimapHeight + 4);
    ctx.strokeStyle = "#4b5563";
    ctx.lineWidth = 2;
    ctx.strokeRect(minimapX - 2, minimapY - 2, minimapWidth + 4, minimapHeight + 4);

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        ctx.fillStyle = MAP[y][x] > 0 ? MINIMAP_WALL_COLOR : MINIMAP_FLOOR_COLOR;
        ctx.fillRect(
          minimapX + x * MINIMAP_SCALE,
          minimapY + y * MINIMAP_SCALE,
          MINIMAP_SCALE,
          MINIMAP_SCALE
        );
      }
    }

    const playerMinimapX = minimapX + player.x * MINIMAP_SCALE;
    const playerMinimapY = minimapY + player.y * MINIMAP_SCALE;
    ctx.fillStyle = MINIMAP_PLAYER_COLOR;
    ctx.beginPath();
    ctx.arc(playerMinimapX, playerMinimapY, MINIMAP_SCALE / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = MINIMAP_PLAYER_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMinimapX, playerMinimapY);
    ctx.lineTo(
      playerMinimapX + Math.cos(player.angle) * MINIMAP_SCALE * 1.5,
      playerMinimapY + Math.sin(player.angle) * MINIMAP_SCALE * 1.5
    );
    ctx.stroke();

    ctx.fillStyle = ENEMY_COLOR;
    for (const enemy of enemiesRef.current) {
        const enemyMinimapX = minimapX + enemy.x * MINIMAP_SCALE;
        const enemyMinimapY = minimapY + enemy.y * MINIMAP_SCALE;
        ctx.beginPath();
        ctx.arc(enemyMinimapX, enemyMinimapY, MINIMAP_SCALE / 2.5, 0, 2 * Math.PI);
        ctx.fill();
    }
  };
  
  const renderHUD = (ctx: CanvasRenderingContext2D) => {
    const player = playerRef.current;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 50);

    ctx.font = '20px "Press Start 2P"';
    ctx.fillStyle = '#ef4444'; // red-500
    ctx.textAlign = 'left';
    ctx.fillText(`HEALTH: ${player.health}`, 10, SCREEN_HEIGHT - 20);
  };

  const renderGameOver = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    ctx.font = '48px "Press Start 2P"';
    ctx.fillStyle = '#b91c1c'; // red-700
    ctx.textAlign = 'center';
    ctx.fillText("YOU DIED", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);

    ctx.font = '24px "Press Start 2P"';
    ctx.fillStyle = 'white';
    
    const buttonText = 'RESTART';
    const textMetrics = ctx.measureText(buttonText);
    const buttonWidth = textMetrics.width + 40;
    const buttonHeight = 50;
    const buttonX = SCREEN_WIDTH / 2 - buttonWidth / 2;
    const buttonY = SCREEN_HEIGHT / 2 + 50;
    
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    ctx.fillText(buttonText, SCREEN_WIDTH / 2, buttonY + 35);
    
    restartButtonRectRef.current = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
  };

  const renderScene = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const player = playerRef.current;
    
    zBufferRef.current.fill(Infinity);
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.fillStyle = CEILING_COLOR;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT / 2);
    ctx.fillStyle = FLOOR_COLOR;
    ctx.fillRect(0, SCREEN_HEIGHT / 2, SCREEN_WIDTH, SCREEN_HEIGHT / 2);

    for (let x = 0; x < SCREEN_WIDTH; x++) {
      const rayAngle = player.angle - FOV / 2 + (x / SCREEN_WIDTH) * FOV;
      const rayDirX = Math.cos(rayAngle);
      const rayDirY = Math.sin(rayAngle);

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);

      let stepX, stepY;
      let sideDistX, sideDistY;
      
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
      }

      let hit = 0;
      let side = 0;
      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (MAP[mapY]?.[mapX] > 0) hit = 1;
      }
      
      let perpWallDist;
      if (side === 0) {
        perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
      } else {
        perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;
      }

      zBufferRef.current[x] = perpWallDist;

      const lineHeight = Math.floor(SCREEN_HEIGHT / perpWallDist);
      const drawStart = -lineHeight / 2 + SCREEN_HEIGHT / 2;
      const drawEnd = lineHeight / 2 + SCREEN_HEIGHT / 2;
      
      const wallType = MAP[mapY][mapX];
      const colors = WALL_COLORS[wallType];
      ctx.fillStyle = side === 1 ? colors.shadow : colors.base;
      
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }
    renderSprites(ctx);
    renderMinimap(ctx);
    renderHUD(ctx);
    
    const now = performance.now();
    if (now - lastDamageTimeRef.current < 150) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }

    if (isGameOver.current) {
        renderGameOver(ctx);
    }
  };

  const gameLoop = () => {
    if (!isGameOver.current) {
        updatePlayer();
        updateEnemies();
        handleFire();
        updateGameObjects();
    }
    renderScene();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };

  return (
    <canvas
      ref={canvasRef}
      width={SCREEN_WIDTH}
      height={SCREEN_HEIGHT}
      className="w-full h-full"
      aria-label="React DOOM game canvas"
    />
  );
};

export default GameCanvas;