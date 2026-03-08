import type { InputState } from "./types";

const keyState: Record<string, boolean> = {};

export function initInput(): void {
  window.addEventListener("keydown", (e) => {
    keyState[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    keyState[e.code] = false;
  });
}

export function getPlayer1Input(): InputState {
  return {
    left: !!keyState["ArrowLeft"],
    right: !!keyState["ArrowRight"],
    up: !!keyState["ArrowUp"],
    down: !!keyState["ArrowDown"],
    pepper: !!keyState["Space"],
  };
}

export function getPlayer2Input(): InputState {
  return {
    left: !!keyState["KeyA"],
    right: !!keyState["KeyD"],
    up: !!keyState["KeyW"],
    down: !!keyState["KeyS"],
    pepper: !!keyState["KeyE"],
  };
}

export function isKeyPressed(code: string): boolean {
  return !!keyState[code];
}

export function clearKey(code: string): void {
  keyState[code] = false;
}
