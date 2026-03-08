import type { IngredientPiece, BurgerStack, Player, Enemy, LevelData, IngredientType } from "./types";
import {
  TILE_SIZE,
  INGREDIENT_WIDTH,
  INGREDIENT_FALL_SPEED,
  PLATFORM_ROWS,
  SCORE_INGREDIENT_DROP,
  SCORE_ENEMY_SQUASH,
  SCORE_BURGER_COMPLETE,
} from "./constants";
import { isOverIngredient, boxOverlap } from "./collision";

export function createIngredients(
  stacks: { col: number; ingredients: IngredientType[]; plateRow: number }[]
): { ingredients: IngredientPiece[]; burgerStacks: BurgerStack[] } {
  const ingredients: IngredientPiece[] = [];
  const burgerStacks: BurgerStack[] = [];

  for (const stack of stacks) {
    const bs: BurgerStack = { col: stack.col, pieces: [], plateRow: stack.plateRow };

    for (let i = 0; i < stack.ingredients.length; i++) {
      const type = stack.ingredients[i];
      if (!type) continue;
      // Place ingredients on platforms starting from top
      const row = PLATFORM_ROWS[i];
      if (row === undefined) continue;

      const piece: IngredientPiece = {
        col: stack.col,
        row,
        type,
        stackIndex: i,
        falling: false,
        fallY: row * TILE_SIZE,
        fallSpeed: 0,
        extraFallLevels: 0,
        targetRow: PLATFORM_ROWS[i + 1] ?? stack.plateRow,
        walkProgress: new Array(INGREDIENT_WIDTH).fill(0) as number[],
        settled: false,
      };

      ingredients.push(piece);
      bs.pieces.push(piece);
    }

    burgerStacks.push(bs);
  }

  return { ingredients, burgerStacks };
}

export function checkPlayerOnIngredient(
  player: Player,
  ingredients: IngredientPiece[]
): void {
  if (!player.alive) return;

  const playerCol = Math.round(player.pos.x / TILE_SIZE);
  const playerRow = Math.round(player.pos.y / TILE_SIZE);

  for (const piece of ingredients) {
    if (piece.falling || piece.settled) continue;

    if (isOverIngredient(playerCol, playerRow, piece.col, piece.row)) {
      const localCol = playerCol - piece.col;
      if (localCol >= 0 && localCol < INGREDIENT_WIDTH) {
        const progress = piece.walkProgress[localCol];
        if (progress !== undefined && progress === 0) {
          piece.walkProgress[localCol] = 1;
        }
      }

      // Check if fully walked over
      if (piece.walkProgress.every((p) => p > 0)) {
        startFalling(piece);
        player.score += SCORE_INGREDIENT_DROP;
      }
    }
  }
}

function startFalling(piece: IngredientPiece): void {
  piece.falling = true;
  piece.fallY = piece.row * TILE_SIZE;
  piece.fallSpeed = INGREDIENT_FALL_SPEED;
  piece.walkProgress = piece.walkProgress.map(() => 0);
}

export function updateIngredients(
  ingredients: IngredientPiece[],
  enemies: Enemy[],
  players: Player[],
  burgerStacks: BurgerStack[]
): void {
  for (const piece of ingredients) {
    if (!piece.falling) continue;

    piece.fallY += piece.fallSpeed;

    const targetY = piece.targetRow * TILE_SIZE;

    // Check if ingredient hits another ingredient in the same stack
    const stack = burgerStacks.find((s) => s.pieces.includes(piece));

    // Check for enemies on the falling ingredient — squash them
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const enemyRow = Math.round(enemy.pos.y / TILE_SIZE);
      const enemyCol = Math.round(enemy.pos.x / TILE_SIZE);
      const pieceCurrentRow = Math.round(piece.fallY / TILE_SIZE);

      if (
        enemyRow === pieceCurrentRow &&
        enemyCol >= piece.col &&
        enemyCol < piece.col + INGREDIENT_WIDTH
      ) {
        enemy.alive = false;
        enemy.respawnTimer = 300;
        piece.extraFallLevels++;
        for (const p of players) {
          if (p.alive) p.score += SCORE_ENEMY_SQUASH;
        }
      }
    }

    if (piece.fallY >= targetY) {
      piece.fallY = targetY;
      piece.row = piece.targetRow;
      piece.falling = false;

      // Check if we land on another piece — push it down too
      if (stack) {
        for (const other of stack.pieces) {
          if (other === piece) continue;
          if (other.row === piece.row && !other.falling && !other.settled) {
            startFalling(other);
          }
        }
      }

      // Handle extra fall levels from squashing enemies
      if (piece.extraFallLevels > 0) {
        const currentIdx = PLATFORM_ROWS.indexOf(piece.row);
        const extraTarget = PLATFORM_ROWS[currentIdx + piece.extraFallLevels];
        if (extraTarget !== undefined) {
          piece.targetRow = extraTarget;
          piece.extraFallLevels = 0;
          startFalling(piece);
        } else {
          // Fall to plate
          piece.targetRow = stack?.plateRow ?? piece.row + 4;
          piece.extraFallLevels = 0;
          startFalling(piece);
        }
      } else {
        // Find next target row
        const currentIdx = PLATFORM_ROWS.indexOf(piece.row);
        const nextPlatform = PLATFORM_ROWS[currentIdx + 1];
        piece.targetRow = nextPlatform ?? (stack?.plateRow ?? piece.row + 4);

        // Check if at plate level
        if (stack && piece.row >= stack.plateRow) {
          piece.settled = true;
          piece.row = stack.plateRow;
          piece.fallY = stack.plateRow * TILE_SIZE;

          // Stack settled pieces
          const settledCount = stack.pieces.filter((p) => p.settled).length;
          piece.row = stack.plateRow - (settledCount - 1);
          piece.fallY = piece.row * TILE_SIZE;

          if (stack.pieces.every((p) => p.settled)) {
            for (const p of players) {
              if (p.alive) p.score += SCORE_BURGER_COMPLETE;
            }
          }
        }
      }
    }
  }
}

export function isLevelComplete(burgerStacks: BurgerStack[]): boolean {
  return burgerStacks.every((stack) => stack.pieces.every((p) => p.settled));
}
