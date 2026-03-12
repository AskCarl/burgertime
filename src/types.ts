export type Direction = "left" | "right" | "up" | "down" | "none";

export type EnemyType = "hotdog" | "pickle" | "egg";

export type IngredientType = "bun-top" | "lettuce" | "meat" | "cheese" | "bun-bottom";

export type GameScreen = "title" | "playing" | "gameover" | "levelcomplete" | "getready";

export type DifficultyMode = "normal" | "kid";

export interface DifficultyConfig {
  lives: number;
  pepper: number;
  enemySpeedMultiplier: number;
  enemySpeedScaling: boolean;
  enemyRandomness: number;
  stunDuration: number;
  invulnDuration: number;
  extraLifeScore: number;
  hitboxScale: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyMode, DifficultyConfig> = {
  normal: {
    lives: 3,
    pepper: 5,
    enemySpeedMultiplier: 1.0,
    enemySpeedScaling: true,
    enemyRandomness: 0,
    stunDuration: 180,
    invulnDuration: 90,
    extraLifeScore: 20000,
    hitboxScale: 0.8,
  },
  kid: {
    lives: Infinity,
    pepper: 8,
    enemySpeedMultiplier: 0.6,
    enemySpeedScaling: false,
    enemyRandomness: 0.3,
    stunDuration: 300,
    invulnDuration: 150,
    extraLifeScore: 10000,
    hitboxScale: 0.6,
  },
};

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
  dying: boolean;
  deathTimer: number;
  deathFrame: number;
  invulnTimer: number;
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
  spawnCol: number;
  spawnRow: number;
  ridingIngredient: number | null;
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
  lastPlayerIndex: number;
  squashedEnemyCount: number;
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
  difficulty: DifficultyMode;
  highScore: number;
  levelCompleteTimer: number;
  bonusItems: BonusItem[];
  bonusSpawnTimer: number;
  getReadyTimer: number;
  scorePopups: ScorePopup[];
}

export interface BonusItem {
  pos: Position;
  type: "icecream" | "coffee" | "fries";
  active: boolean;
  points: number;
  ttl: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  value: number;
  timer: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  pepper: boolean;
}
