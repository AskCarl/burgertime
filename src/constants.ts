export const TILE_SIZE = 16;
export const COLS = 28;
export const ROWS = 32;
export const CANVAS_WIDTH = COLS * TILE_SIZE;
export const CANVAS_HEIGHT = ROWS * TILE_SIZE;

export const PLAYER_SPEED = 1.25;
export const ENEMY_BASE_SPEED = 0.75;
export const ENEMY_SPEED_INCREMENT = 0.08;

export const PEPPER_DURATION = 40;
export const PEPPER_RANGE = 3;
export const STUN_DURATION = 180;
export const RESPAWN_DELAY = 300;
export const PLAYER_RESPAWN_DELAY = 120;

export const INGREDIENT_FALL_SPEED = 3;
export const INGREDIENT_WIDTH = 4;

export const STARTING_LIVES = 3;
export const STARTING_PEPPER = 3;
export const EXTRA_LIFE_SCORE = 20000;

export const SCORE_INGREDIENT_DROP = 50;
export const SCORE_ENEMY_SQUASH = 500;
export const SCORE_BURGER_COMPLETE = 1000;
export const SCORE_BONUS_ITEM = 300;

export const LEVEL_COMPLETE_DELAY = 180;

export const COLORS = {
  bg: "#000000",
  platform: "#6B4226",
  ladder: "#66CCFF",
  player1: "#FFFFFF",
  player1Hat: "#FF0000",
  player1Body: "#FFFFFF",
  player2: "#00FF00",
  player2Hat: "#00AA00",
  player2Body: "#00FF00",
  bunTop: "#D2691E",
  bunTopSesame: "#FFD700",
  bunBottom: "#D2691E",
  lettuce: "#00CC00",
  meat: "#8B4513",
  cheese: "#FFD700",
  hotdog: "#FF6347",
  hotdogBun: "#F5DEB3",
  pickle: "#228B22",
  egg: "#FFFFFF",
  eggYolk: "#FFD700",
  pepper: "#FF4444",
  text: "#FFFFFF",
  scoreText: "#FFD700",
  hud: "#FF0000",
  plate: "#4444FF",
  icecream: "#FF69B4",
  coffee: "#8B4513",
  fries: "#FFD700",
};

export const PLATFORM_ROWS = [5, 9, 13, 17, 21, 25];
export const HUD_HEIGHT = 3;
