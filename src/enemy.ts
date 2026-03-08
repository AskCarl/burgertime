import type { Enemy, Player, LevelData, GridPosition, EnemyType } from "./types";
import {
  TILE_SIZE,
  ENEMY_BASE_SPEED,
  ENEMY_SPEED_INCREMENT,
  STUN_DURATION,
  RESPAWN_DELAY,
  PEPPER_RANGE,
} from "./constants";
import {
  isOnPlatform,
  isOnLadder,
  canMoveDirection,
  isAlignedToGrid,
  snapToGrid,
  distanceBetween,
} from "./collision";

export function createEnemy(
  col: number,
  row: number,
  type: EnemyType,
  level: number
): Enemy {
  return {
    pos: { x: col * TILE_SIZE, y: row * TILE_SIZE },
    gridPos: { col, row },
    direction: "left",
    type,
    alive: true,
    stunTimer: 0,
    respawnTimer: 0,
    speed: ENEMY_BASE_SPEED + level * ENEMY_SPEED_INCREMENT,
    walkFrame: 0,
    walkTimer: 0,
    subPixelX: 0,
    subPixelY: 0,
  };
}

export function updateEnemy(
  enemy: Enemy,
  players: Player[],
  levelData: LevelData
): void {
  if (!enemy.alive) {
    enemy.respawnTimer--;
    if (enemy.respawnTimer <= 0) {
      // Find a spawn position from level data
      const spawn = levelData.enemySpawns.find((s) => s.type === enemy.type);
      if (spawn) {
        enemy.pos = { x: spawn.col * TILE_SIZE, y: spawn.row * TILE_SIZE };
        enemy.gridPos = { col: spawn.col, row: spawn.row };
      }
      enemy.alive = true;
      enemy.stunTimer = 0;
      enemy.subPixelX = 0;
      enemy.subPixelY = 0;
    }
    return;
  }

  if (enemy.stunTimer > 0) {
    enemy.stunTimer--;
    return;
  }

  const aligned = isAlignedToGrid(enemy.pos);

  if (aligned) {
    enemy.pos = snapToGrid(enemy.pos);
    enemy.gridPos = {
      col: Math.round(enemy.pos.x / TILE_SIZE),
      row: Math.round(enemy.pos.y / TILE_SIZE),
    };

    // Find nearest alive player
    const alivePlayers = players.filter((p) => p.alive);
    if (alivePlayers.length === 0) return;

    let nearestPlayer = alivePlayers[0];
    if (!nearestPlayer) return;
    let nearestDist = distanceBetween(enemy.gridPos, nearestPlayer.gridPos);

    for (const p of alivePlayers) {
      const d = distanceBetween(enemy.gridPos, p.gridPos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestPlayer = p;
      }
    }

    // Simple pathfinding: prefer direction toward player
    const target = nearestPlayer.gridPos;
    const possibleDirs: ("left" | "right" | "up" | "down")[] = [];

    const onPlatform = isOnPlatform(enemy.pos, levelData);
    const onLadder = isOnLadder(enemy.pos, levelData);

    if (onPlatform) {
      if (canMoveDirection(enemy.pos, "left", levelData)) possibleDirs.push("left");
      if (canMoveDirection(enemy.pos, "right", levelData)) possibleDirs.push("right");
    }
    if (onLadder) {
      if (canMoveDirection(enemy.pos, "up", levelData)) possibleDirs.push("up");
      if (canMoveDirection(enemy.pos, "down", levelData)) possibleDirs.push("down");
    }

    if (possibleDirs.length === 0) return;

    // Sort by which direction gets us closer to the player
    possibleDirs.sort((a, b) => {
      const aPos = getNextGrid(enemy.gridPos, a);
      const bPos = getNextGrid(enemy.gridPos, b);
      return distanceBetween(aPos, target) - distanceBetween(bPos, target);
    });

    // Add some randomness to avoid predictable movement
    let newDir = possibleDirs[0];
    if (possibleDirs.length > 1 && Math.random() < 0.2) {
      const idx = Math.floor(Math.random() * possibleDirs.length);
      newDir = possibleDirs[idx];
    }

    if (newDir && newDir !== enemy.direction) {
      enemy.direction = newDir;
      // Reset accumulators on direction change to prevent drift
      enemy.subPixelX = 0;
      enemy.subPixelY = 0;
    }
  }

  // Move in current direction using subpixel accumulation
  const isHoriz = enemy.direction === "left" || enemy.direction === "right";
  if (isHoriz) {
    enemy.subPixelX += enemy.speed;
    const px = Math.trunc(enemy.subPixelX);
    enemy.subPixelX -= px;
    switch (enemy.direction) {
      case "left":
        enemy.pos.x -= px;
        break;
      case "right":
        enemy.pos.x += px;
        break;
    }
  } else {
    enemy.subPixelY += enemy.speed;
    const px = Math.trunc(enemy.subPixelY);
    enemy.subPixelY -= px;
    switch (enemy.direction) {
      case "up":
        enemy.pos.y -= px;
        break;
      case "down":
        enemy.pos.y += px;
        break;
    }
  }

  enemy.walkTimer++;
  if (enemy.walkTimer >= 10) {
    enemy.walkTimer = 0;
    enemy.walkFrame = (enemy.walkFrame + 1) % 2;
  }
}

function getNextGrid(pos: GridPosition, dir: "left" | "right" | "up" | "down"): GridPosition {
  switch (dir) {
    case "left":
      return { col: pos.col - 1, row: pos.row };
    case "right":
      return { col: pos.col + 1, row: pos.row };
    case "up":
      return { col: pos.col, row: pos.row - 1 };
    case "down":
      return { col: pos.col, row: pos.row + 1 };
  }
}

export function checkPepperHit(
  player: Player,
  enemies: Enemy[]
): void {
  if (!player.pepperActive || !player.alive) return;

  const playerCol = Math.round(player.pos.x / TILE_SIZE);
  const playerRow = Math.round(player.pos.y / TILE_SIZE);

  for (const enemy of enemies) {
    if (!enemy.alive || enemy.stunTimer > 0) continue;

    const enemyCol = Math.round(enemy.pos.x / TILE_SIZE);
    const enemyRow = Math.round(enemy.pos.y / TILE_SIZE);

    const colDist = Math.abs(enemyCol - playerCol);
    const rowDist = Math.abs(enemyRow - playerRow);

    let inRange = false;
    switch (player.pepperDirection) {
      case "left":
        inRange = enemyCol <= playerCol && colDist <= PEPPER_RANGE && rowDist <= 1;
        break;
      case "right":
        inRange = enemyCol >= playerCol && colDist <= PEPPER_RANGE && rowDist <= 1;
        break;
      case "up":
        inRange = enemyRow <= playerRow && rowDist <= PEPPER_RANGE && colDist <= 1;
        break;
      case "down":
        inRange = enemyRow >= playerRow && rowDist <= PEPPER_RANGE && colDist <= 1;
        break;
      default:
        inRange = colDist <= PEPPER_RANGE && rowDist <= 1;
    }

    if (inRange) {
      enemy.stunTimer = STUN_DURATION;
    }
  }
}

export function checkEnemyPlayerCollision(
  enemy: Enemy,
  player: Player
): boolean {
  if (!enemy.alive || !player.alive || enemy.stunTimer > 0) return false;

  const dx = Math.abs(enemy.pos.x - player.pos.x);
  const dy = Math.abs(enemy.pos.y - player.pos.y);

  return dx < TILE_SIZE * 0.8 && dy < TILE_SIZE * 0.8;
}
