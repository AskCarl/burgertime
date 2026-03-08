export type Direction = "left" | "right" | "up" | "down" | "none";

export type EnemyType = "hotdog" | "pickle" | "egg";

export type IngredientType = "bun-top" | "lettuce" | "meat" | "cheese" | "bun-bottom";

export type GameScreen = "title" | "playing" | "gameover" | "levelcomplete";

export interface Position {
  x: number;
  y: number;
}

export interface GridPosition {
  col: number;
  row: number;
}

export interface Player {
  pos: Position;
  gridPos: GridPosition;
  direction: Direction;
  facing: Direction;
  alive: boolean;
  respawnTimer: number;
  pepperCount: number;
  pepperActive: boolean;
  pepperTimer: number;
  pepperDirection: Direction;
  walkFrame: number;
  walkTimer: number;
  subPixelX: number;
  subPixelY: number;
  score: number;
  lives: number;
  extraLifeAwarded: boolean;
  playerIndex: number;
}

export interface Enemy {
  pos: Position;
  gridPos: GridPosition;
  direction: Direction;
  type: EnemyType;
  alive: boolean;
  stunTimer: number;
  respawnTimer: number;
  speed: number;
  walkFrame: number;
  walkTimer: number;
  subPixelX: number;
  subPixelY: number;
}

export interface IngredientPiece {
  col: number;
  row: number;
  type: IngredientType;
  stackIndex: number;
  falling: boolean;
  fallY: number;
  fallSpeed: number;
  extraFallLevels: number;
  targetRow: number;
  walkProgress: number[];
  settled: boolean;
}

export interface BurgerStack {
  col: number;
  pieces: IngredientPiece[];
  plateRow: number;
}

export interface LevelData {
  platforms: boolean[][];
  ladders: boolean[][];
  burgerStacks: {
    col: number;
    ingredients: IngredientType[];
    plateRow: number;
  }[];
  enemySpawns: {
    col: number;
    row: number;
    type: EnemyType;
  }[];
  playerSpawn: GridPosition;
  player2Spawn: GridPosition;
}

export interface GameState {
  screen: GameScreen;
  players: Player[];
  enemies: Enemy[];
  ingredients: IngredientPiece[];
  burgerStacks: BurgerStack[];
  level: number;
  levelData: LevelData;
  twoPlayerMode: boolean;
  highScore: number;
  levelCompleteTimer: number;
  bonusItems: BonusItem[];
  bonusSpawnTimer: number;
}

export interface BonusItem {
  pos: Position;
  type: "icecream" | "coffee" | "fries";
  active: boolean;
  points: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pepper: boolean;
}
