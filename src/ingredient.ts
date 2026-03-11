import type { IngredientPiece, BurgerStack, Player, Enemy, LevelData, IngredientType, ScorePopup } from "./types";
import {
  TILE_SIZE,
  INGREDIENT_WIDTH,
  INGREDIENT_FALL_SPEED,
  PLATFORM_ROWS,
  SCORE_INGREDIENT_DROP,
  ENEMY_SQUASH_SCORES,
  SCORE_BURGER_COMPLETE,
  RESPAWN_DELAY,
} from "./constants";
import { isOverIngredient } from "./collision";
import { playEnemySquashSound, playBurgerCompleteSound, playFallSound } from "./audio";

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
        lastPlayerIndex: 0,
        squashedEnemyCount: 0,
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
  ingredients: IngredientPiece[],
  scorePopups: ScorePopup[]
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

      // Track which player is walking on this ingredient
      piece.lastPlayerIndex = player.playerIndex;

      // Check if fully walked over
      if (piece.walkProgress.every((p) => p > 0)) {
        startFalling(piece);
        player.score += SCORE_INGREDIENT_DROP;
        scorePopups.push({ x: piece.col * TILE_SIZE, y: piece.row * TILE_SIZE, value: SCORE_INGREDIENT_DROP, timer: 60 });
      }
    }
  }
}

function startFalling(piece: IngredientPiece): void {
  piece.falling = true;
  piece.fallY = piece.row * TILE_SIZE;
  piece.fallSpeed = INGREDIENT_FALL_SPEED;
  piece.walkProgress = piece.walkProgress.map(() => 0);
  piece.squashedEnemyCount = 0;
  playFallSound();
}

export function updateIngredients(
  ingredients: IngredientPiece[],
  enemies: Enemy[],
  players: Player[],
  burgerStacks: BurgerStack[],
  scorePopups: ScorePopup[]
): void {
  for (const piece of ingredients) {
    if (!piece.falling) continue;

    piece.fallY += piece.fallSpeed;

    const targetY = piece.targetRow * TILE_SIZE;

    // Check if ingredient hits another ingredient in the same stack
    const stack = burgerStacks.find((s) => s.pieces.includes(piece));

    // Check for enemies on the falling ingredient — attach and ride
    for (let ei = 0; ei < enemies.length; ei++) {
      const enemy = enemies[ei];
      if (!enemy || !enemy.alive || enemy.ridingIngredient !== null) continue;
      const enemyRow = Math.round(enemy.pos.y / TILE_SIZE);
      const enemyCol = Math.round(enemy.pos.x / TILE_SIZE);
      const pieceCurrentRow = Math.round(piece.fallY / TILE_SIZE);

      if (
        enemyRow === pieceCurrentRow &&
        enemyCol >= piece.col &&
        enemyCol < piece.col + INGREDIENT_WIDTH
      ) {
        // Attach enemy to this ingredient — rides down
        enemy.ridingIngredient = ingredients.indexOf(piece);
        piece.extraFallLevels++;
      }
    }

    // Update riding enemies' positions to track the ingredient
    for (const enemy of enemies) {
      if (enemy.ridingIngredient === null || !enemy.alive) continue;
      if (ingredients[enemy.ridingIngredient] === piece) {
        enemy.pos.y = piece.fallY;
      }
    }

    if (piece.fallY >= targetY) {
      piece.fallY = targetY;
      piece.row = piece.targetRow;
      piece.falling = false;

      // Kill all riding enemies on landing — award exponential score
      const pieceIdx = ingredients.indexOf(piece);
      for (const enemy of enemies) {
        if (enemy.ridingIngredient === pieceIdx && enemy.alive) {
          enemy.alive = false;
          enemy.respawnTimer = RESPAWN_DELAY;
          enemy.ridingIngredient = null;
          const scoreIdx = Math.min(piece.squashedEnemyCount, ENEMY_SQUASH_SCORES.length - 1);
          const points = ENEMY_SQUASH_SCORES[scoreIdx] ?? 500;
          piece.squashedEnemyCount++;
          const scorer = players.find((p) => p.playerIndex === piece.lastPlayerIndex);
          if (scorer) {
            scorer.score += points;
          }
          scorePopups.push({ x: enemy.pos.x, y: enemy.pos.y, value: points, timer: 60 });
          playEnemySquashSound();
        }
      }

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
            // Award completion bonus to the player who dropped the final piece
            const scorer = players.find((p) => p.playerIndex === piece.lastPlayerIndex);
            if (scorer) {
              scorer.score += SCORE_BURGER_COMPLETE;
            }
            scorePopups.push({ x: piece.col * TILE_SIZE, y: piece.row * TILE_SIZE, value: SCORE_BURGER_COMPLETE, timer: 60 });
            playBurgerCompleteSound();
          }
        }
      }
    }
  }
}

export function isLevelComplete(burgerStacks: BurgerStack[]): boolean {
  return burgerStacks.every((stack) => stack.pieces.every((p) => p.settled));
}
