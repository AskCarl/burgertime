import type { Position, GridPosition, LevelData } from "./types";
import { TILE_SIZE, INGREDIENT_WIDTH } from "./constants";

export function isOnPlatform(pos: Position, levelData: LevelData): boolean {
  const col = Math.round(pos.x / TILE_SIZE);
  const row = Math.round(pos.y / TILE_SIZE);
  const platformRow = levelData.platforms[row];
  return !!platformRow?.[col];
}

export function isOnLadder(pos: Position, levelData: LevelData): boolean {
  const col = Math.round(pos.x / TILE_SIZE);
  const row = Math.round(pos.y / TILE_SIZE);
  const ladderRow = levelData.ladders[row];
  return !!ladderRow?.[col];
}

export function canMoveDirection(
  pos: Position,
  direction: "left" | "right" | "up" | "down",
  levelData: LevelData
): boolean {
  const col = Math.round(pos.x / TILE_SIZE);
  const row = Math.round(pos.y / TILE_SIZE);

  switch (direction) {
    case "left": {
      const platformRow = levelData.platforms[row];
      return !!platformRow?.[col - 1];
    }
    case "right": {
      const platformRow = levelData.platforms[row];
      return !!platformRow?.[col + 1];
    }
    case "up": {
      const ladderRow = levelData.ladders[row - 1];
      return !!ladderRow?.[col];
    }
    case "down": {
      const ladderRow = levelData.ladders[row + 1];
      return !!ladderRow?.[col];
    }
  }
}

export function isAlignedToGrid(pos: Position): boolean {
  const threshold = 1;
  const xMod = pos.x % TILE_SIZE;
  const yMod = pos.y % TILE_SIZE;
  return (
    (xMod < threshold || xMod > TILE_SIZE - threshold) &&
    (yMod < threshold || yMod > TILE_SIZE - threshold)
  );
}

export function snapToGrid(pos: Position): Position {
  return {
    x: Math.round(pos.x / TILE_SIZE) * TILE_SIZE,
    y: Math.round(pos.y / TILE_SIZE) * TILE_SIZE,
  };
}

export function isOverIngredient(
  playerCol: number,
  playerRow: number,
  ingredientCol: number,
  ingredientRow: number
): boolean {
  return (
    playerRow === ingredientRow &&
    playerCol >= ingredientCol &&
    playerCol < ingredientCol + INGREDIENT_WIDTH
  );
}

export function distanceBetween(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}
