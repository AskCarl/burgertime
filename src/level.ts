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
      ladderRow[col + 1] = true; // ladders are 2 tiles wide
    }
  }
}

export function getLevel(levelIndex: number): LevelData {
  const levelNum = levelIndex % 6;

  if (levelNum === 0) return createLevel1();
  if (levelNum === 1) return createLevel2();
  if (levelNum === 2) return createLevel3();
  if (levelNum === 3) return createLevel4();
  if (levelNum === 4) return createLevel5();
  return createLevel6();
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

  // Staggered platforms — each must cover ingredient cols (5-8, 11-14, 17-20)
  // and ladder endpoints
  addPlatform(platforms, 5, 2, 14);       // covers stacks 1,2 + ladders
  addPlatform(platforms, 5, 17, 25);      // covers stack 3 + ladders
  addPlatform(platforms, 9, 5, 25);       // covers all 3 stacks
  addPlatform(platforms, 13, 2, 21);      // covers all 3 stacks
  addPlatform(platforms, 17, 5, 25);      // covers all 3 stacks
  addPlatform(platforms, 21, 2, 21);      // covers all 3 stacks
  addPlatform(platforms, 25, 2, 25);      // full bottom

  // Ladders — each endpoint must land on platform tiles above
  addLadder(ladders, 5, 5, 9);
  addLadder(ladders, 13, 5, 9);
  addLadder(ladders, 20, 5, 9);

  addLadder(ladders, 8, 9, 13);
  addLadder(ladders, 17, 9, 13);

  addLadder(ladders, 5, 13, 17);
  addLadder(ladders, 12, 13, 17);
  addLadder(ladders, 19, 13, 17);

  addLadder(ladders, 8, 17, 21);
  addLadder(ladders, 15, 17, 21);

  addLadder(ladders, 5, 21, 25);
  addLadder(ladders, 11, 21, 25);
  addLadder(ladders, 18, 21, 25);

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

  // Stacks at cols 4(4-7), 10(10-13), 16(16-19), 22(22-25)
  // All platforms must cover those ranges + ladder endpoints
  addPlatform(platforms, 5, 2, 13);       // covers stacks 1,2
  addPlatform(platforms, 5, 15, 25);      // covers stacks 3,4
  addPlatform(platforms, 9, 4, 8);        // covers stack 1
  addPlatform(platforms, 9, 10, 20);      // covers stacks 2,3
  addPlatform(platforms, 9, 22, 25);      // covers stack 4
  addPlatform(platforms, 13, 2, 14);      // covers stacks 1,2
  addPlatform(platforms, 13, 16, 25);     // covers stacks 3,4
  addPlatform(platforms, 17, 4, 13);      // covers stacks 1,2
  addPlatform(platforms, 17, 15, 25);     // covers stacks 3,4
  addPlatform(platforms, 21, 2, 25);      // full width
  addPlatform(platforms, 25, 2, 25);      // full bottom

  // Ladders — both endpoints on platforms
  addLadder(ladders, 6, 5, 9);     // row5(2-13) → row9(4-8) ✓
  addLadder(ladders, 12, 5, 9);    // row5(2-13) → row9(10-20) ✓
  addLadder(ladders, 18, 5, 9);    // row5(15-25) → row9(10-20) ✓
  addLadder(ladders, 24, 5, 9);    // row5(15-25) → row9(22-25) ✓

  addLadder(ladders, 4, 9, 13);    // row9(4-8) → row13(2-14) ✓
  addLadder(ladders, 13, 9, 13);   // row9(10-20) → row13(2-14) ✓
  addLadder(ladders, 18, 9, 13);   // row9(10-20) → row13(16-25) ✓

  addLadder(ladders, 8, 13, 17);   // row13(2-14) → row17(4-13) ✓
  addLadder(ladders, 16, 13, 17);  // row13(16-25) → row17(15-25) ✓
  addLadder(ladders, 22, 13, 17);  // row13(16-25) → row17(15-25) ✓

  addLadder(ladders, 6, 17, 21);   // row17(4-13) → row21(2-25) ✓
  addLadder(ladders, 12, 17, 21);  // row17(4-13) → row21(2-25) ✓
  addLadder(ladders, 18, 17, 21);  // row17(15-25) → row21(2-25) ✓

  addLadder(ladders, 4, 21, 25);   // row21 → row25 ✓
  addLadder(ladders, 10, 21, 25);
  addLadder(ladders, 16, 21, 25);
  addLadder(ladders, 22, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "lettuce", "cheese", "meat", "bun-bottom"];

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
      { col: 14, row: 9, type: "pickle" },
      { col: 8, row: 13, type: "egg" },
      { col: 20, row: 13, type: "pickle" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}

function createLevel4(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // Level 4: More vertical, tall ladders, 4 stacks, 5 enemies
  addPlatform(platforms, 5, 2, 25);
  addPlatform(platforms, 9, 4, 12);
  addPlatform(platforms, 9, 16, 24);
  addPlatform(platforms, 13, 2, 25);
  addPlatform(platforms, 17, 4, 12);
  addPlatform(platforms, 17, 16, 24);
  addPlatform(platforms, 21, 2, 25);
  addPlatform(platforms, 25, 2, 25);

  addLadder(ladders, 4, 5, 13);
  addLadder(ladders, 10, 5, 9);
  addLadder(ladders, 16, 5, 9);
  addLadder(ladders, 22, 5, 13);

  addLadder(ladders, 8, 9, 13);
  addLadder(ladders, 20, 9, 13);

  addLadder(ladders, 4, 13, 21);
  addLadder(ladders, 12, 13, 17);
  addLadder(ladders, 16, 13, 17);
  addLadder(ladders, 22, 13, 21);

  addLadder(ladders, 8, 17, 21);
  addLadder(ladders, 20, 17, 21);

  addLadder(ladders, 6, 21, 25);
  addLadder(ladders, 14, 21, 25);
  addLadder(ladders, 18, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "lettuce", "cheese", "meat", "bun-bottom"];

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
      { col: 24, row: 5, type: "pickle" },
      { col: 8, row: 9, type: "hotdog" },
      { col: 20, row: 13, type: "egg" },
      { col: 14, row: 21, type: "pickle" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}

function createLevel5(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // Level 5: Asymmetric split layout, 3 stacks, 5 enemies
  addPlatform(platforms, 5, 2, 10);
  addPlatform(platforms, 5, 14, 25);
  addPlatform(platforms, 9, 6, 20);
  addPlatform(platforms, 13, 2, 12);
  addPlatform(platforms, 13, 16, 25);
  addPlatform(platforms, 17, 4, 22);
  addPlatform(platforms, 21, 2, 25);
  addPlatform(platforms, 25, 2, 25);

  addLadder(ladders, 6, 5, 9);
  addLadder(ladders, 14, 5, 9);
  addLadder(ladders, 20, 5, 9);

  addLadder(ladders, 8, 9, 13);
  addLadder(ladders, 18, 9, 13);

  addLadder(ladders, 4, 13, 17);
  addLadder(ladders, 12, 13, 17);
  addLadder(ladders, 20, 13, 17);

  addLadder(ladders, 6, 17, 21);
  addLadder(ladders, 14, 17, 21);
  addLadder(ladders, 18, 17, 21);

  addLadder(ladders, 4, 21, 25);
  addLadder(ladders, 10, 21, 25);
  addLadder(ladders, 22, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "cheese", "meat", "bun-bottom"];

  return {
    platforms,
    ladders,
    burgerStacks: [
      { col: 5, ingredients, plateRow: 27 },
      { col: 12, ingredients, plateRow: 27 },
      { col: 19, ingredients, plateRow: 27 },
    ],
    enemySpawns: [
      { col: 2, row: 5, type: "hotdog" },
      { col: 24, row: 5, type: "egg" },
      { col: 10, row: 9, type: "pickle" },
      { col: 16, row: 13, type: "hotdog" },
      { col: 8, row: 17, type: "pickle" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}

function createLevel6(): LevelData {
  const platforms = createEmptyGrid();
  const ladders = createEmptyGrid();

  // Level 6: Dense with many short ladders, 4 stacks, 6 enemies
  addPlatform(platforms, 5, 2, 25);
  addPlatform(platforms, 9, 2, 25);
  addPlatform(platforms, 13, 2, 25);
  addPlatform(platforms, 17, 2, 25);
  addPlatform(platforms, 21, 2, 25);
  addPlatform(platforms, 25, 2, 25);

  addLadder(ladders, 3, 5, 9);
  addLadder(ladders, 7, 5, 9);
  addLadder(ladders, 11, 5, 9);
  addLadder(ladders, 15, 5, 9);
  addLadder(ladders, 19, 5, 9);
  addLadder(ladders, 23, 5, 9);

  addLadder(ladders, 5, 9, 13);
  addLadder(ladders, 9, 9, 13);
  addLadder(ladders, 13, 9, 13);
  addLadder(ladders, 17, 9, 13);
  addLadder(ladders, 21, 9, 13);

  addLadder(ladders, 3, 13, 17);
  addLadder(ladders, 7, 13, 17);
  addLadder(ladders, 11, 13, 17);
  addLadder(ladders, 15, 13, 17);
  addLadder(ladders, 19, 13, 17);
  addLadder(ladders, 23, 13, 17);

  addLadder(ladders, 5, 17, 21);
  addLadder(ladders, 9, 17, 21);
  addLadder(ladders, 13, 17, 21);
  addLadder(ladders, 17, 17, 21);
  addLadder(ladders, 21, 17, 21);

  addLadder(ladders, 3, 21, 25);
  addLadder(ladders, 11, 21, 25);
  addLadder(ladders, 15, 21, 25);
  addLadder(ladders, 23, 21, 25);

  const ingredients: IngredientType[] = ["bun-top", "lettuce", "cheese", "meat", "bun-bottom"];

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
      { col: 8, row: 9, type: "pickle" },
      { col: 18, row: 9, type: "egg" },
      { col: 12, row: 13, type: "pickle" },
      { col: 20, row: 13, type: "egg" },
    ],
    playerSpawn: { col: 14, row: 25 },
    player2Spawn: { col: 12, row: 25 },
  };
}
