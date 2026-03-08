import type { GameState, Player, Enemy, IngredientPiece, BonusItem } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  COLS,
  ROWS,
  COLORS,
  PLATFORM_ROWS,
  INGREDIENT_WIDTH,
  HUD_HEIGHT,
  PEPPER_RANGE,
} from "./constants";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

export function initRenderer(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  canvas = document.getElementById("game") as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const scale = Math.min(
    window.innerWidth / CANVAS_WIDTH,
    window.innerHeight / CANVAS_HEIGHT,
    3
  );
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;

  const renderCtx = canvas.getContext("2d");
  if (!renderCtx) throw new Error("Could not get 2d context");
  ctx = renderCtx;
  ctx.imageSmoothingEnabled = false;

  window.addEventListener("resize", () => {
    const s = Math.min(
      window.innerWidth / CANVAS_WIDTH,
      window.innerHeight / CANVAS_HEIGHT,
      3
    );
    canvas.style.width = `${CANVAS_WIDTH * s}px`;
    canvas.style.height = `${CANVAS_HEIGHT * s}px`;
  });

  return { canvas, ctx };
}

export function render(state: GameState): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  switch (state.screen) {
    case "title":
      renderTitle(state);
      break;
    case "playing":
      renderGame(state);
      break;
    case "levelcomplete":
      renderGame(state);
      renderLevelComplete(state);
      break;
    case "gameover":
      renderGame(state);
      renderGameOver(state);
      break;
  }
}

function renderTitle(state: GameState): void {
  ctx.fillStyle = COLORS.scoreText;
  ctx.font = "bold 32px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BURGERTIME", CANVAS_WIDTH / 2, 120);

  ctx.fillStyle = COLORS.text;
  ctx.font = "16px monospace";
  ctx.fillText("Press ENTER to Start", CANVAS_WIDTH / 2, 200);
  ctx.fillText("Press 2 for 2-Player Mode", CANVAS_WIDTH / 2, 230);

  ctx.font = "12px monospace";
  ctx.fillText("Player 1: Arrow Keys + Space", CANVAS_WIDTH / 2, 290);
  ctx.fillText("Player 2: WASD + E", CANVAS_WIDTH / 2, 310);

  ctx.fillStyle = COLORS.scoreText;
  ctx.font = "14px monospace";
  ctx.fillText(`HIGH SCORE: ${state.highScore}`, CANVAS_WIDTH / 2, 370);

  // Draw a little burger
  drawIngredientPixels(CANVAS_WIDTH / 2 - 32, 400, "bun-top");
  drawIngredientPixels(CANVAS_WIDTH / 2 - 32, 414, "lettuce");
  drawIngredientPixels(CANVAS_WIDTH / 2 - 32, 428, "meat");
  drawIngredientPixels(CANVAS_WIDTH / 2 - 32, 442, "bun-bottom");
}

function renderGame(state: GameState): void {
  renderHUD(state);
  renderPlatformsAndLadders(state);
  renderPlates(state);
  renderIngredients(state);
  renderBonusItems(state);

  for (const enemy of state.enemies) {
    renderEnemy(enemy);
  }

  for (const player of state.players) {
    renderPlayer(player);
    if (player.pepperActive) {
      renderPepper(player);
    }
  }
}

function renderHUD(state: GameState): void {
  ctx.fillStyle = COLORS.hud;
  ctx.font = "12px monospace";
  ctx.textAlign = "left";

  const p1 = state.players[0];
  if (p1) {
    ctx.fillStyle = COLORS.scoreText;
    ctx.fillText(`1UP ${p1.score.toString().padStart(6, "0")}`, 8, 14);

    // Lives
    for (let i = 0; i < p1.lives; i++) {
      drawMiniChef(8 + i * 12, 20, COLORS.player1Hat);
    }

    // Pepper count
    ctx.fillStyle = COLORS.pepper;
    ctx.font = "10px monospace";
    ctx.fillText("P:" + p1.pepperCount, 8, 42);
  }

  ctx.fillStyle = COLORS.scoreText;
  ctx.textAlign = "center";
  ctx.font = "12px monospace";
  ctx.fillText(`HI ${state.highScore.toString().padStart(6, "0")}`, CANVAS_WIDTH / 2, 14);
  ctx.fillText(`LV ${state.level + 1}`, CANVAS_WIDTH / 2, 28);

  if (state.twoPlayerMode) {
    const p2 = state.players[1];
    if (p2) {
      ctx.textAlign = "right";
      ctx.fillStyle = COLORS.player2;
      ctx.fillText(`2UP ${p2.score.toString().padStart(6, "0")}`, CANVAS_WIDTH - 8, 14);

      for (let i = 0; i < p2.lives; i++) {
        drawMiniChef(CANVAS_WIDTH - 40 + i * 12, 20, COLORS.player2Hat);
      }

      ctx.fillStyle = COLORS.pepper;
      ctx.font = "10px monospace";
      ctx.fillText("P:" + p2.pepperCount, CANVAS_WIDTH - 8, 42);
    }
  }
}

function drawMiniChef(x: number, y: number, hatColor: string): void {
  ctx.fillStyle = hatColor;
  ctx.fillRect(x + 1, y, 6, 3);
  ctx.fillStyle = COLORS.text;
  ctx.fillRect(x + 2, y + 3, 4, 5);
}

function renderPlatformsAndLadders(state: GameState): void {
  const ld = state.levelData;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const platformRow = ld.platforms[r];
      const ladderRow = ld.ladders[r];

      if (ladderRow?.[c]) {
        ctx.fillStyle = COLORS.ladder;
        // Draw ladder rungs
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, 2, TILE_SIZE);
        ctx.fillRect(c * TILE_SIZE + TILE_SIZE - 2, r * TILE_SIZE, 2, TILE_SIZE);
        if (r % 2 === 0) {
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE + 4, TILE_SIZE, 2);
          ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE + 12, TILE_SIZE, 2);
        }
      }

      if (platformRow?.[c]) {
        ctx.fillStyle = COLORS.platform;
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE + TILE_SIZE - 3, TILE_SIZE, 3);
      }
    }
  }
}

function renderPlates(state: GameState): void {
  for (const stack of state.burgerStacks) {
    ctx.fillStyle = COLORS.plate;
    const plateY = stack.plateRow * TILE_SIZE + TILE_SIZE - 2;
    ctx.fillRect(
      stack.col * TILE_SIZE - 4,
      plateY,
      INGREDIENT_WIDTH * TILE_SIZE + 8,
      4
    );
  }
}

function renderIngredients(state: GameState): void {
  for (const piece of state.ingredients) {
    const y = piece.falling ? piece.fallY : piece.row * TILE_SIZE;
    drawIngredientPixels(piece.col * TILE_SIZE, y, piece.type);

    // Show walk progress indicators
    if (!piece.falling && !piece.settled) {
      for (let i = 0; i < INGREDIENT_WIDTH; i++) {
        if (piece.walkProgress[i]) {
          // Slightly depress this section
          ctx.fillStyle = COLORS.bg;
          ctx.fillRect(
            (piece.col + i) * TILE_SIZE,
            y + 2,
            TILE_SIZE,
            1
          );
        }
      }
    }
  }
}

function drawIngredientPixels(x: number, y: number, type: string): void {
  const w = INGREDIENT_WIDTH * TILE_SIZE;

  switch (type) {
    case "bun-top":
      ctx.fillStyle = COLORS.bunTop;
      // Rounded top bun shape
      ctx.fillRect(x + 4, y, w - 8, 4);
      ctx.fillRect(x + 2, y + 2, w - 4, 6);
      ctx.fillRect(x, y + 4, w, 8);
      // Sesame seeds
      ctx.fillStyle = COLORS.bunTopSesame;
      ctx.fillRect(x + 10, y + 2, 3, 2);
      ctx.fillRect(x + 24, y + 2, 3, 2);
      ctx.fillRect(x + 40, y + 3, 3, 2);
      break;

    case "bun-bottom":
      ctx.fillStyle = COLORS.bunBottom;
      ctx.fillRect(x, y + 4, w, 8);
      ctx.fillRect(x + 2, y + 2, w - 4, 10);
      break;

    case "lettuce":
      ctx.fillStyle = COLORS.lettuce;
      for (let i = 0; i < w; i += 4) {
        const h = (i % 8 === 0) ? 10 : 8;
        ctx.fillRect(x + i, y + (12 - h), 4, h);
      }
      break;

    case "meat":
      ctx.fillStyle = COLORS.meat;
      ctx.fillRect(x + 2, y + 2, w - 4, 10);
      ctx.fillRect(x, y + 4, w, 6);
      // Grill lines
      ctx.fillStyle = "#5C2D00";
      ctx.fillRect(x + 6, y + 5, w - 12, 1);
      ctx.fillRect(x + 6, y + 8, w - 12, 1);
      break;

    case "cheese":
      ctx.fillStyle = COLORS.cheese;
      ctx.fillRect(x, y + 4, w, 6);
      ctx.fillRect(x + 2, y + 2, w - 4, 10);
      // Melty edges
      ctx.fillRect(x - 2, y + 8, 4, 4);
      ctx.fillRect(x + w - 2, y + 8, 4, 4);
      break;
  }
}

function renderPlayer(player: Player): void {
  if (!player.alive) return;

  const x = player.pos.x;
  const y = player.pos.y;
  const isP2 = player.playerIndex === 1;
  const hatColor = isP2 ? COLORS.player2Hat : COLORS.player1Hat;
  const bodyColor = isP2 ? COLORS.player2Body : COLORS.player1Body;

  // Hat
  ctx.fillStyle = hatColor;
  ctx.fillRect(x + 2, y - 4, 12, 5);
  ctx.fillRect(x + 4, y - 6, 8, 3);

  // Face
  ctx.fillStyle = "#FFCC99";
  ctx.fillRect(x + 3, y + 1, 10, 6);

  // Eyes
  ctx.fillStyle = "#000";
  if (player.facing === "left") {
    ctx.fillRect(x + 4, y + 3, 2, 2);
  } else {
    ctx.fillRect(x + 10, y + 3, 2, 2);
  }

  // Body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x + 3, y + 7, 10, 6);

  // Legs (animated)
  if (player.walkFrame % 2 === 0) {
    ctx.fillRect(x + 3, y + 13, 4, 3);
    ctx.fillRect(x + 9, y + 13, 4, 3);
  } else {
    ctx.fillRect(x + 2, y + 13, 4, 3);
    ctx.fillRect(x + 10, y + 13, 4, 3);
  }
}

function renderPepper(player: Player): void {
  ctx.fillStyle = COLORS.pepper;
  const px = player.pos.x + 8;
  const py = player.pos.y + 4;

  // Draw pepper cloud in facing direction
  let pepperX = px;
  let pepperY = py;

  switch (player.pepperDirection) {
    case "left":
      pepperX = px - TILE_SIZE * 2;
      break;
    case "right":
      pepperX = px + TILE_SIZE;
      break;
    case "up":
      pepperY = py - TILE_SIZE * 2;
      break;
    case "down":
      pepperY = py + TILE_SIZE;
      break;
  }

  // Pepper cloud particles
  const t = player.pepperTimer;
  for (let i = 0; i < 6; i++) {
    const ox = Math.sin(t * 0.3 + i * 1.5) * 6;
    const oy = Math.cos(t * 0.4 + i * 1.2) * 4;
    ctx.fillRect(pepperX + ox, pepperY + oy, 3, 3);
  }
}

function renderEnemy(enemy: Enemy): void {
  if (!enemy.alive) return;

  const x = enemy.pos.x;
  const y = enemy.pos.y;

  if (enemy.stunTimer > 0) {
    // Flashing when stunned
    if (Math.floor(enemy.stunTimer / 4) % 2 === 0) return;
  }

  switch (enemy.type) {
    case "hotdog":
      // Bun
      ctx.fillStyle = COLORS.hotdogBun;
      ctx.fillRect(x + 2, y + 2, 12, 10);
      // Hotdog
      ctx.fillStyle = COLORS.hotdog;
      ctx.fillRect(x + 4, y + 4, 8, 6);
      // Eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(x + 5, y + 3, 2, 2);
      ctx.fillRect(x + 9, y + 3, 2, 2);
      // Legs
      ctx.fillStyle = COLORS.hotdogBun;
      if (enemy.walkFrame === 0) {
        ctx.fillRect(x + 3, y + 12, 3, 4);
        ctx.fillRect(x + 10, y + 12, 3, 4);
      } else {
        ctx.fillRect(x + 2, y + 12, 3, 4);
        ctx.fillRect(x + 11, y + 12, 3, 4);
      }
      break;

    case "pickle":
      // Body
      ctx.fillStyle = COLORS.pickle;
      ctx.fillRect(x + 3, y + 1, 10, 12);
      ctx.fillRect(x + 5, y, 6, 14);
      // Eyes
      ctx.fillStyle = "#FFF";
      ctx.fillRect(x + 5, y + 3, 3, 3);
      ctx.fillRect(x + 9, y + 3, 3, 3);
      ctx.fillStyle = "#000";
      ctx.fillRect(x + 6, y + 4, 1, 1);
      ctx.fillRect(x + 10, y + 4, 1, 1);
      // Bumps
      ctx.fillStyle = "#1A6E1A";
      ctx.fillRect(x + 3, y + 6, 2, 2);
      ctx.fillRect(x + 11, y + 8, 2, 2);
      // Legs
      ctx.fillStyle = COLORS.pickle;
      if (enemy.walkFrame === 0) {
        ctx.fillRect(x + 4, y + 13, 3, 3);
        ctx.fillRect(x + 9, y + 13, 3, 3);
      } else {
        ctx.fillRect(x + 3, y + 13, 3, 3);
        ctx.fillRect(x + 10, y + 13, 3, 3);
      }
      break;

    case "egg":
      // Body
      ctx.fillStyle = COLORS.egg;
      ctx.fillRect(x + 3, y + 1, 10, 11);
      ctx.fillRect(x + 5, y, 6, 13);
      // Yolk
      ctx.fillStyle = COLORS.eggYolk;
      ctx.fillRect(x + 5, y + 4, 6, 5);
      // Eyes
      ctx.fillStyle = "#000";
      ctx.fillRect(x + 5, y + 2, 2, 2);
      ctx.fillRect(x + 9, y + 2, 2, 2);
      // Legs
      ctx.fillStyle = COLORS.eggYolk;
      if (enemy.walkFrame === 0) {
        ctx.fillRect(x + 4, y + 13, 3, 3);
        ctx.fillRect(x + 9, y + 13, 3, 3);
      } else {
        ctx.fillRect(x + 3, y + 13, 3, 3);
        ctx.fillRect(x + 10, y + 13, 3, 3);
      }
      break;
  }
}

function renderBonusItems(state: GameState): void {
  for (const item of state.bonusItems) {
    if (!item.active) continue;

    const x = item.pos.x;
    const y = item.pos.y;

    switch (item.type) {
      case "icecream":
        ctx.fillStyle = COLORS.icecream;
        ctx.fillRect(x + 4, y, 8, 8);
        ctx.fillStyle = "#F5DEB3";
        ctx.fillRect(x + 5, y + 8, 6, 6);
        break;
      case "coffee":
        ctx.fillStyle = COLORS.coffee;
        ctx.fillRect(x + 3, y + 4, 10, 10);
        ctx.fillStyle = "#DDD";
        ctx.fillRect(x + 12, y + 6, 3, 4);
        break;
      case "fries":
        ctx.fillStyle = COLORS.fries;
        ctx.fillRect(x + 3, y + 2, 2, 10);
        ctx.fillRect(x + 6, y + 1, 2, 11);
        ctx.fillRect(x + 9, y + 3, 2, 9);
        ctx.fillRect(x + 12, y + 2, 2, 10);
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(x + 2, y + 8, 12, 6);
        break;
    }
  }
}

function renderLevelComplete(state: GameState): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 40, CANVAS_WIDTH, 80);

  ctx.fillStyle = COLORS.scoreText;
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
}

function renderGameOver(state: GameState): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = COLORS.hud;
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

  const p1 = state.players[0];
  if (p1) {
    ctx.fillStyle = COLORS.scoreText;
    ctx.font = "16px monospace";
    ctx.fillText(`SCORE: ${p1.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  if (state.twoPlayerMode) {
    const p2 = state.players[1];
    if (p2) {
      ctx.fillStyle = COLORS.player2;
      ctx.fillText(`P2 SCORE: ${p2.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
    }
  }

  ctx.fillStyle = COLORS.text;
  ctx.font = "14px monospace";
  ctx.fillText("Press ENTER to Continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}
