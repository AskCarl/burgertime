import type { Player, InputState, LevelData, GridPosition } from "./types";
import {
  PLAYER_SPEED,
  TILE_SIZE,
  STARTING_LIVES,
  STARTING_PEPPER,
  PEPPER_DURATION,
  PLAYER_RESPAWN_DELAY,
  EXTRA_LIFE_SCORE,
} from "./constants";
import { isOnPlatform, isOnLadder, canMoveDirection, isAlignedToGrid, snapToGrid } from "./collision";

export function createPlayer(spawn: GridPosition, index: number): Player {
  return {
    pos: { x: spawn.col * TILE_SIZE, y: spawn.row * TILE_SIZE },
    gridPos: { ...spawn },
    direction: "none",
    facing: "right",
    alive: true,
    respawnTimer: 0,
    pepperCount: STARTING_PEPPER,
    pepperActive: false,
    pepperTimer: 0,
    pepperDirection: "right",
    walkFrame: 0,
    walkTimer: 0,
    subPixelX: 0,
    subPixelY: 0,
    score: 0,
    lives: STARTING_LIVES,
    extraLifeAwarded: false,
    playerIndex: index,
  };
}

let prevPepperPressed: boolean[] = [false, false];

/**
 * Add fractional speed to accumulator, return whole pixels to move.
 */
function accumMove(player: Player, axis: "x" | "y", speed: number): number {
  if (axis === "x") {
    player.subPixelX += speed;
    const px = Math.trunc(player.subPixelX);
    player.subPixelX -= px;
    return px;
  } else {
    player.subPixelY += speed;
    const px = Math.trunc(player.subPixelY);
    player.subPixelY -= px;
    return px;
  }
}

export function updatePlayer(
  player: Player,
  input: InputState,
  levelData: LevelData
): void {
  if (!player.alive) {
    player.respawnTimer--;
    if (player.respawnTimer <= 0) {
      const spawn = player.playerIndex === 0 ? levelData.playerSpawn : levelData.player2Spawn;
      player.pos = { x: spawn.col * TILE_SIZE, y: spawn.row * TILE_SIZE };
      player.gridPos = { ...spawn };
      player.alive = true;
      player.direction = "none";
      player.subPixelX = 0;
      player.subPixelY = 0;
    }
    return;
  }

  // Pepper throw
  if (player.pepperActive) {
    player.pepperTimer--;
    if (player.pepperTimer <= 0) {
      player.pepperActive = false;
    }
    return;
  }

  const pepperJustPressed = input.pepper && !prevPepperPressed[player.playerIndex];
  prevPepperPressed[player.playerIndex] = input.pepper;

  if (pepperJustPressed && player.pepperCount > 0 && !player.pepperActive) {
    player.pepperActive = true;
    player.pepperTimer = PEPPER_DURATION;
    player.pepperDirection = player.facing;
    player.pepperCount--;
    return;
  }

  const aligned = isAlignedToGrid(player.pos);

  if (aligned) {
    player.pos = snapToGrid(player.pos);
    player.gridPos = {
      col: Math.round(player.pos.x / TILE_SIZE),
      row: Math.round(player.pos.y / TILE_SIZE),
    };
    // Reset accumulators at grid points to prevent drift
    player.subPixelX = 0;
    player.subPixelY = 0;
  }

  const noInput = !input.left && !input.right && !input.up && !input.down;

  // If no input and not aligned, coast to the next grid point
  if (!aligned && (noInput || player.direction === "none")) {
    coastToGrid(player);
    return;
  }

  // Use snapped position for surface checks
  const checkPos = aligned ? player.pos : snapToGrid(player.pos);
  const onPlatform = isOnPlatform(checkPos, levelData);
  const onLadder = isOnLadder(checkPos, levelData);

  const movingHorizontal = player.direction === "left" || player.direction === "right";
  const movingVertical = player.direction === "up" || player.direction === "down";
  const canChangeAxis = aligned || player.direction === "none";

  let moving = false;

  // Horizontal movement on platforms
  if (onPlatform && (input.left || input.right)) {
    if (canChangeAxis || movingHorizontal) {
      const px = accumMove(player, "x", PLAYER_SPEED);
      if (input.left && canMoveDirection(checkPos, "left", levelData)) {
        player.pos.x -= px;
        player.direction = "left";
        player.facing = "left";
        moving = true;
      } else if (input.right && canMoveDirection(checkPos, "right", levelData)) {
        player.pos.x += px;
        player.direction = "right";
        player.facing = "right";
        moving = true;
      } else {
        // Undo accumulation if we didn't move
        player.subPixelX = 0;
      }
    }
  }

  // Vertical movement on ladders
  if (onLadder && (input.up || input.down) && !moving) {
    if (canChangeAxis || movingVertical) {
      const px = accumMove(player, "y", PLAYER_SPEED);
      if (input.up && canMoveDirection(checkPos, "up", levelData)) {
        player.pos.y -= px;
        player.direction = "up";
        moving = true;
      } else if (input.down && canMoveDirection(checkPos, "down", levelData)) {
        player.pos.y += px;
        player.direction = "down";
        moving = true;
      } else {
        player.subPixelY = 0;
      }
    }
  }

  if (!moving) {
    if (!aligned && player.direction !== "none") {
      coastToGrid(player);
    } else {
      player.direction = "none";
    }
  }

  if (moving) {
    player.walkTimer++;
    if (player.walkTimer >= 10) {
      player.walkTimer = 0;
      player.walkFrame = (player.walkFrame + 1) % 4;
    }
  }

  // Extra life check
  if (!player.extraLifeAwarded && player.score >= EXTRA_LIFE_SCORE) {
    player.lives++;
    player.extraLifeAwarded = true;
  }
}

/**
 * Slide toward the next grid point in the current travel direction.
 */
function coastToGrid(player: Player): void {
  const xOff = player.pos.x % TILE_SIZE;
  const yOff = player.pos.y % TILE_SIZE;

  switch (player.direction) {
    case "left": {
      const step = Math.min(2, xOff || TILE_SIZE);
      player.pos.x -= step;
      break;
    }
    case "right": {
      const remaining = xOff === 0 ? 0 : TILE_SIZE - xOff;
      const step = Math.min(2, remaining);
      player.pos.x += step;
      break;
    }
    case "up": {
      const step = Math.min(2, yOff || TILE_SIZE);
      player.pos.y -= step;
      break;
    }
    case "down": {
      const remaining = yOff === 0 ? 0 : TILE_SIZE - yOff;
      const step = Math.min(2, remaining);
      player.pos.y += step;
      break;
    }
    default: {
      player.pos = snapToGrid(player.pos);
      break;
    }
  }

  if (isAlignedToGrid(player.pos)) {
    player.pos = snapToGrid(player.pos);
    player.gridPos = {
      col: Math.round(player.pos.x / TILE_SIZE),
      row: Math.round(player.pos.y / TILE_SIZE),
    };
    player.direction = "none";
    player.subPixelX = 0;
    player.subPixelY = 0;
  }
}

export function killPlayer(player: Player, levelData: LevelData): void {
  if (!player.alive) return;
  player.lives--;
  player.alive = false;
  player.respawnTimer = PLAYER_RESPAWN_DELAY;
  player.direction = "none";
}
