import type { LevelData, IngredientType } from "./types";
import { COLS, ROWS, PLATFORM_ROWS } from "./constants";

function createEmptyGrid(): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < ROWS; r++) {
    grid.push(new Array<boolean>(COLS).fill(false));
  }
  return grid;
}

function addPlatform(platforms: boolean[][], row: number, startCol: number, endCol: number): void {
  for (let c = startCol; c <= endCol; c++) {
    const platformRow = platforms[row];
    if (platformRow) {
      platformRow[c] = true;
    }
  }
}

function addLadder(ladders: boolean[][], col: number, startRow: number, endRow: number): void {
  for (let r = startRow; r <= endRow; r++) {
    const ladderRow = ladders[r];
    if (ladderRow) {
      ladderRow[col] = true;
      const nextCol = ladders[r];
      if (nextCol) {
        nextCol[col + 1] = true;
      }
    }
  }
}

export function getLevel(levelIndex: number): LevelData {
  const levelNum = levelIndex % 3;

  if (levelNum === 0) return createLevel1();
  if (levelNum === 1) return createLevel2();
  return createLevel3();
}

function createLevel1(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // Full-width platforms at standard rows
  for (const row of PLATFORM_ROWS) {
    addPlatform(platforms, row, 2, 25);
  }

  // Ladders connecting platforms
  addLadder(ladders, 4, 5, 9);
  addLadder(ladders, 10, 5, 9);
  addLadder(ladders, 16, 5, 9);
  addLadder(ladders, 22, 5, 9);

  addLadder(ladders, 6, 9, 13);
  addLadder(ladders, 13, 9, 13);
  addLadder(ladders, 20, 9, 13);

  addLadder(ladders, 4, 13, 17);
  addLadder(ladders, 10, 13, 17);
  addLadder(ladders, 16, 13, 17);
  addLadder(ladders, 22, 13, 17);

  addLadder(ladders, 6, 17, 21);
  addLadder(ladders, 13, 17, 21);
  addLadder(ladders, 20, 17, 21);

  addLadder(ladders, 4, 21, 25);
  addLadder(ladders, 10, 21, 25);
  addLadder(ladders, 16, 21, 25);
  addLadder(ladders, 22, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "lettuce", "meat", "bun-bottom"];

  return {
    platforms,
    ladders,
    burgerStacks: [
      { col: 4, ingredients, plateRow: 27 },
      { col: 10, ingredients, plateRow: 27 },
      { col: 16, ingredients, plateRow: 27 },
      { col: 22, ingredients, plateRow: 27 },
    ],
    enemySpawns: [
      { col: 2, row: 5, type: "hotdog" },
      { col: 24, row: 5, type: "hotdog" },
      { col: 13, row: 9, type: "pickle" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}

function createLevel2(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // Staggered platforms
  addPlatform(platforms, 5, 2, 14);
  addPlatform(platforms, 5, 18, 25);
  addPlatform(platforms, 9, 6, 25);
  addPlatform(platforms, 13, 2, 20);
  addPlatform(platforms, 17, 8, 25);
  addPlatform(platforms, 21, 2, 18);
  addPlatform(platforms, 25, 2, 25);

  addLadder(ladders, 4, 5, 9);
  addLadder(ladders, 12, 5, 9);
  addLadder(ladders, 20, 5, 9);

  addLadder(ladders, 8, 9, 13);
  addLadder(ladders, 16, 9, 13);

  addLadder(ladders, 10, 13, 17);
  addLadder(ladders, 18, 13, 17);

  addLadder(ladders, 6, 17, 21);
  addLadder(ladders, 14, 17, 21);

  addLadder(ladders, 4, 21, 25);
  addLadder(ladders, 10, 21, 25);
  addLadder(ladders, 16, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "cheese", "meat", "lettuce", "bun-bottom"];

  return {
    platforms,
    ladders,
    burgerStacks: [
      { col: 5, ingredients, plateRow: 27 },
      { col: 11, ingredients, plateRow: 27 },
      { col: 17, ingredients, plateRow: 27 },
    ],
    enemySpawns: [
      { col: 2, row: 5, type: "hotdog" },
      { col: 24, row: 5, type: "pickle" },
      { col: 13, row: 9, type: "hotdog" },
      { col: 8, row: 13, type: "egg" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}

function createLevel3(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // More complex layout with shorter platforms
  addPlatform(platforms, 5, 2, 10);
  addPlatform(platforms, 5, 14, 25);
  addPlatform(platforms, 9, 2, 8);
  addPlatform(platforms, 9, 11, 18);
  addPlatform(platforms, 9, 21, 25);
  addPlatform(platforms, 13, 4, 14);
  addPlatform(platforms, 13, 17, 25);
  addPlatform(platforms, 17, 2, 10);
  addPlatform(platforms, 17, 13, 22);
  addPlatform(platforms, 21, 6, 20);
  addPlatform(platforms, 25, 2, 25);

  addLadder(ladders, 4, 5, 9);
  addLadder(ladders, 8, 5, 9);
  addLadder(ladders, 16, 5, 9);
  addLadder(ladders, 22, 5, 9);

  addLadder(ladders, 6, 9, 13);
  addLadder(ladders, 12, 9, 13);
  addLadder(ladders, 18, 9, 13);

  addLadder(ladders, 8, 13, 17);
  addLadder(ladders, 14, 13, 17);
  addLadder(ladders, 20, 13, 17);

  addLadder(ladders, 8, 17, 21);
  addLadder(ladders, 16, 17, 21);

  addLadder(ladders, 8, 21, 25);
  addLadder(ladders, 14, 21, 25);
  addLadder(ladders, 18, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "lettuce", "cheese", "meat", "bun-bottom"];

  return {
    platforms,
    ladders,
    burgerStacks: [
      { col: 5, ingredients, plateRow: 27 },
      { col: 9, ingredients, plateRow: 27 },
      { col: 15, ingredients, plateRow: 27 },
      { col: 19, ingredients, plateRow: 27 },
    ],
    enemySpawns: [
      { col: 2, row: 5, type: "hotdog" },
      { col: 24, row: 5, type: "hotdog" },
      { col: 14, row: 9, type: "pickle" },
      { col: 6, row: 13, type: "egg" },
      { col: 20, row: 13, type: "pickle" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}
