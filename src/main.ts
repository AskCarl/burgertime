import { initRenderer, render } from "./renderer";
import { initInput } from "./input";
import { initAudio } from "./audio";
import { createGameState, updateGame } from "./game";

function main(): void {
  initRenderer();
  initInput();
  initAudio();

  const state = createGameState();

  function gameLoop(): void {
    updateGame(state);
    render(state);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

main();
