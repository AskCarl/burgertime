import type { GameState, Player, Enemy, BonusItem } from "./types";
import { getLevel } from "./level";
import { createPlayer, updatePlayer, killPlayer, resetPlayerState } from "./player";
import { createEnemy, updateEnemy, checkPepperHit, checkEnemyPlayerCollision } from "./enemy";
import {
  createIngredients,
  checkPlayerOnIngredient,
  updateIngredients,
  isLevelComplete,
} from "./ingredient";
import { getPlayer1Input, getPlayer2Input, isKeyPressed, clearKey } from "./input";
import {
  LEVEL_COMPLETE_DELAY,
  TILE_SIZE,
  SCORE_BONUS_ITEM,
  BONUS_ITEM_TTL,
} from "./constants";
import {
  playDeathSound,
  playLevelCompleteSound,
  playBonusSound,
  playPepperSound,
} from "./audio";

const HIGH_SCORE_KEY = "burgertime_highscore";

export function createGameState(): GameState {
  const savedHigh = localStorage.getItem(HIGH_SCORE_KEY);
  const highScore = savedHigh ? parseInt(savedHigh, 10) : 0;

  return {
    screen: "title",
    players: [],
    enemies: [],
    ingredients: [],
    burgerStacks: [],
    level: 0,
    levelData: getLevel(0),
    twoPlayerMode: false,
    highScore: isNaN(highScore) ? 0 : highScore,
    levelCompleteTimer: 0,
    bonusItems: [],
    bonusSpawnTimer: 0,
  };
}

function initLevel(state: GameState): void {
  const levelData = getLevel(state.level);
  state.levelData = levelData;

  // Create players
  state.players = [createPlayer(levelData.playerSpawn, 0)];
  if (state.twoPlayerMode) {
    state.players.push(createPlayer(levelData.player2Spawn, 1));
  }

  // Create enemies (more enemies at higher levels)
  const enemySpawns = levelData.enemySpawns;
  state.enemies = enemySpawns.map((spawn) =>
    createEnemy(spawn.col, spawn.row, spawn.type, state.level)
  );

  // Create ingredients
  const { ingredients, burgerStacks } = createIngredients(levelData.burgerStacks);
  state.ingredients = ingredients;
  state.burgerStacks = burgerStacks;

  state.bonusItems = [];
  state.bonusSpawnTimer = 600;
  state.levelCompleteTimer = 0;
}

export function startGame(state: GameState, twoPlayer: boolean): void {
  state.twoPlayerMode = twoPlayer;
  state.level = 0;
  state.screen = "playing";
  resetPlayerState();
  initLevel(state);
}

export function updateGame(state: GameState): void {
  switch (state.screen) {
    case "title":
      updateTitle(state);
      break;
    case "playing":
      updatePlaying(state);
      break;
    case "levelcomplete":
      updateLevelComplete(state);
      break;
    case "gameover":
      updateGameOver(state);
      break;
  }
}

function updateTitle(state: GameState): void {
  if (isKeyPressed("Enter")) {
    clearKey("Enter");
    startGame(state, false);
  }
  if (isKeyPressed("Digit2")) {
    clearKey("Digit2");
    startGame(state, true);
  }
}

function updatePlaying(state: GameState): void {
  const inputs = [getPlayer1Input(), getPlayer2Input()];

  // Update players
  for (let i = 0; i < state.players.length; i++) {
    const player = state.players[i];
    const input = inputs[i];
    if (!player || !input) continue;

    const wasPeppering = player.pepperActive;
    updatePlayer(player, input, state.levelData);

    // Play pepper sound on activation
    if (player.pepperActive && !wasPeppering) {
      playPepperSound();
    }

    // Check ingredient walk-over
    checkPlayerOnIngredient(player, state.ingredients);

    // Check pepper hit
    checkPepperHit(player, state.enemies);
  }

  // Update enemies
  for (const enemy of state.enemies) {
    updateEnemy(enemy, state.players, state.levelData);

    // Check collision with players
    for (const player of state.players) {
      if (checkEnemyPlayerCollision(enemy, player)) {
        killPlayer(player);
        playDeathSound();
      }
    }
  }

  // Update ingredients
  updateIngredients(state.ingredients, state.enemies, state.players, state.burgerStacks);

  // Update bonus items
  updateBonusItems(state);

  // Check level complete
  if (isLevelComplete(state.burgerStacks)) {
    state.screen = "levelcomplete";
    state.levelCompleteTimer = LEVEL_COMPLETE_DELAY;
    playLevelCompleteSound();
  }

  // Check game over
  const allDead = state.players.every((p) => p.lives <= 0);
  if (allDead) {
    state.screen = "gameover";
    updateHighScore(state);
  }
}

function updateLevelComplete(state: GameState): void {
  state.levelCompleteTimer--;
  if (state.levelCompleteTimer <= 0) {
    // Save scores and lives
    const savedPlayers = state.players.map((p) => ({
      score: p.score,
      lives: p.lives,
      pepperCount: p.pepperCount,
      extraLifeAwarded: p.extraLifeAwarded,
    }));

    state.level++;
    initLevel(state);

    // Restore scores and lives
    for (let i = 0; i < savedPlayers.length && i < state.players.length; i++) {
      const saved = savedPlayers[i];
      const player = state.players[i];
      if (saved && player) {
        player.score = saved.score;
        player.lives = saved.lives;
        player.pepperCount = saved.pepperCount;
        player.extraLifeAwarded = saved.extraLifeAwarded;
      }
    }

    state.screen = "playing";
  }
}

function updateGameOver(state: GameState): void {
  if (isKeyPressed("Enter")) {
    clearKey("Enter");
    state.screen = "title";
  }
}

function updateBonusItems(state: GameState): void {
  state.bonusSpawnTimer--;
  if (state.bonusSpawnTimer <= 0) {
    state.bonusSpawnTimer = 900 + Math.floor(Math.random() * 600);

    const types: ("icecream" | "coffee" | "fries")[] = ["icecream", "coffee", "fries"];
    const type = types[Math.floor(Math.random() * types.length)];
    if (!type) return;

    // Place on a random platform
    const row = [9, 13, 17, 21][Math.floor(Math.random() * 4)];
    const col = 8 + Math.floor(Math.random() * 12);
    if (row === undefined) return;

    const item: BonusItem = {
      pos: { x: col * TILE_SIZE, y: row * TILE_SIZE },
      type,
      active: true,
      points: SCORE_BONUS_ITEM,
      ttl: BONUS_ITEM_TTL,
    };
    state.bonusItems.push(item);
  }

  // Tick TTL and check player pickup
  for (const item of state.bonusItems) {
    if (!item.active) continue;

    item.ttl--;
    if (item.ttl <= 0) {
      item.active = false;
      continue;
    }

    for (const player of state.players) {
      if (!player.alive) continue;
      const dx = Math.abs(player.pos.x - item.pos.x);
      const dy = Math.abs(player.pos.y - item.pos.y);

      if (dx < TILE_SIZE && dy < TILE_SIZE) {
        item.active = false;
        player.score += item.points;
        player.pepperCount++;
        playBonusSound();
      }
    }
  }

  // Remove inactive items
  state.bonusItems = state.bonusItems.filter((i) => i.active);
}

function updateHighScore(state: GameState): void {
  let maxScore = 0;
  for (const p of state.players) {
    if (p.score > maxScore) maxScore = p.score;
  }

  if (maxScore > state.highScore) {
    state.highScore = maxScore;
    localStorage.setItem(HIGH_SCORE_KEY, maxScore.toString());
  }
}
