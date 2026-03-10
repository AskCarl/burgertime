import { initRenderer, render } from "./renderer";
import { initInput } from "./input";
import { initAudio } from "./audio";
import { createGameState, updateGame } from "./game";

const TARGET_DT = 1000 / 60; // fixed 60fps timestep
const MAX_FRAME_TIME = 200;  // cap to prevent spiral of death

function main(): void {
  initRenderer();
  initInput();
  initAudio();

  const state = createGameState();
  let accumulator = 0;
  let lastTime = 0;

  function gameLoop(timestamp: number): void {
    if (lastTime === 0) lastTime = timestamp;

    let frameTime = timestamp - lastTime;
    lastTime = timestamp;

    // Clamp to prevent huge catch-up after tab switch
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    accumulator += frameTime;

    while (accumulator >= TARGET_DT) {
      updateGame(state);
      accumulator -= TARGET_DT;
    }

    render(state);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

main();
