import type { GameState, Player, Enemy, IngredientType } from "./types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  COLS,
  ROWS,
  COLORS,
  INGREDIENT_WIDTH,
} from "./constants";
import {
  drawSprite,
  PALETTE,
  getChefSprite,
  getDeathSprite,
  getEnemySprite,
  getIngredientSprite,
  PEPPER_CLOUD,
  MINI_CHEF,
  ICECREAM_SPRITE,
  COFFEE_SPRITE,
  FRIES_SPRITE,
} from "./sprites";

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

export function initRenderer(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  canvas = document.getElementById("game") as HTMLCanvasElement;
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const renderCtx = canvas.getContext("2d");
  if (!renderCtx) throw new Error("Could not get 2d context");
  ctx = renderCtx;
  ctx.imageSmoothingEnabled = false;

  function scaleCanvas(): void {
    const touchControls = document.getElementById("touch-controls");
    const controlsHeight = touchControls?.offsetHeight ?? 0;
    const availHeight = window.innerHeight - controlsHeight;
    const scale = Math.min(
      window.innerWidth / CANVAS_WIDTH,
      availHeight / CANVAS_HEIGHT,
      3
    );
    canvas.style.width = `${CANVAS_WIDTH * scale}px`;
    canvas.style.height = `${CANVAS_HEIGHT * scale}px`;

    // Scale touch controls to match canvas width
    if (touchControls) {
      touchControls.style.maxWidth = `${CANVAS_WIDTH * scale}px`;
    }
  }

  scaleCanvas();
  window.addEventListener("resize", scaleCanvas);

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
    case "getready":
      renderGame(state);
      renderGetReady();
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

  // Score popups
  for (const popup of state.scorePopups) {
    ctx.fillStyle = COLORS.scoreText;
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(popup.value.toString(), popup.x + 8, popup.y);
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

    // Lives (cap display at 5)
    for (let i = 0; i < Math.min(p1.lives, 5); i++) {
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

      for (let i = 0; i < Math.min(p2.lives, 5); i++) {
        drawMiniChef(CANVAS_WIDTH - 40 + i * 12, 20, COLORS.player2Hat);
      }

      ctx.fillStyle = COLORS.pepper;
      ctx.font = "10px monospace";
      ctx.fillText("P:" + p2.pepperCount, CANVAS_WIDTH - 8, 42);
    }
  }
}

function drawMiniChef(x: number, y: number, hatColor: string): void {
  const miniPalette = { ...PALETTE, 1: hatColor };
  drawSprite(ctx, x, y, MINI_CHEF, miniPalette);
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

function drawIngredientPixels(x: number, y: number, type: IngredientType): void {
  const sprite = getIngredientSprite(type);
  drawSprite(ctx, x, y, sprite, PALETTE);
}

function renderPlayer(player: Player): void {
  // Death animation
  if (player.dying) {
    const sprite = getDeathSprite(player.deathFrame);
    const isP2 = player.playerIndex === 1;
    const palette = isP2 ? { ...PALETTE, 1: "#00AA00" } : PALETTE;
    drawSprite(ctx, player.pos.x, player.pos.y - 4, sprite, palette);
    return;
  }

  if (!player.alive) return;

  // Invulnerability blink — skip every other 4-frame window
  if (player.invulnTimer > 0 && Math.floor(player.invulnTimer / 4) % 2 === 0) {
    return;
  }

  const x = player.pos.x;
  const y = player.pos.y;
  const sprite = getChefSprite(player.facing, player.walkFrame);
  const isP2 = player.playerIndex === 1;
  const palette = isP2 ? { ...PALETTE, 1: "#00AA00" } : PALETTE;
  drawSprite(ctx, x, y - 4, sprite, palette);
}

function renderPepper(player: Player): void {
  const px = player.pos.x + 8;
  const py = player.pos.y + 4;

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

  // Flicker effect based on timer
  if (player.pepperTimer % 4 < 2) {
    drawSprite(ctx, pepperX - 8, pepperY - 8, PEPPER_CLOUD, PALETTE);
  }
}

function renderEnemy(enemy: Enemy): void {
  if (!enemy.alive) return;

  const x = enemy.pos.x;
  const y = enemy.pos.y;

  if (enemy.stunTimer > 0) {
    if (Math.floor(enemy.stunTimer / 4) % 2 === 0) return;
  }

  const sprite = getEnemySprite(enemy.type, enemy.walkFrame);
  drawSprite(ctx, x, y, sprite, PALETTE);
}

function renderBonusItems(state: GameState): void {
  for (const item of state.bonusItems) {
    if (!item.active) continue;

    const x = item.pos.x;
    const y = item.pos.y;

    const spriteMap: Record<string, number[][]> = {
      icecream: ICECREAM_SPRITE,
      coffee: COFFEE_SPRITE,
      fries: FRIES_SPRITE,
    };
    const sprite = spriteMap[item.type];
    if (sprite) {
      drawSprite(ctx, x, y, sprite, PALETTE);
    }
  }
}

function renderGetReady(): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, CANVAS_HEIGHT / 2 - 30, CANVAS_WIDTH, 60);

  ctx.fillStyle = COLORS.scoreText;
  ctx.font = "bold 24px monospace";
  ctx.textAlign = "center";
  ctx.fillText("GET READY", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 8);
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
