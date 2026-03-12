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

  initTouchControls();
}

// --- Touch controls ---

const touchState: Record<string, boolean> = {};
let touchControlsVisible = false;

function showTouchControls(): void {
  if (touchControlsVisible) return;
  const el = document.getElementById("touch-controls");
  if (el) {
    el.style.display = "flex";
    touchControlsVisible = true;
  }
}

function initTouchControls(): void {
  // Show touch controls on first touch anywhere
  window.addEventListener("touchstart", () => showTouchControls(), { once: true });

  // Also show if no mouse movement detected (likely mobile)
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    showTouchControls();
  }

  // D-pad buttons
  const dpadBtns = document.querySelectorAll<HTMLElement>(".dpad-btn[data-dir]");
  for (const btn of dpadBtns) {
    const dir = btn.dataset["dir"];
    if (!dir) continue;

    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      touchState[dir] = true;
      btn.classList.add("active");
    }, { passive: false });

    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      touchState[dir] = false;
      btn.classList.remove("active");
    }, { passive: false });

    btn.addEventListener("touchcancel", () => {
      touchState[dir] = false;
      btn.classList.remove("active");
    });
  }

  // Pepper button
  const pepperBtn = document.querySelector<HTMLElement>('[data-action="pepper"]');
  if (pepperBtn) {
    pepperBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      touchState["pepper"] = true;
      pepperBtn.classList.add("active");
    }, { passive: false });

    pepperBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      touchState["pepper"] = false;
      pepperBtn.classList.remove("active");
    }, { passive: false });

    pepperBtn.addEventListener("touchcancel", () => {
      touchState["pepper"] = false;
      pepperBtn.classList.remove("active");
    });
  }

  // Start button — maps to Enter
  const startBtn = document.querySelector<HTMLElement>('[data-action="start"]');
  if (startBtn) {
    startBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keyState["Enter"] = true;
      startBtn.classList.add("active");
    }, { passive: false });

    startBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keyState["Enter"] = false;
      startBtn.classList.remove("active");
    }, { passive: false });

    startBtn.addEventListener("touchcancel", () => {
      keyState["Enter"] = false;
      startBtn.classList.remove("active");
    });
  }

  // Kid mode button — maps to K key
  const kidBtn = document.querySelector<HTMLElement>('[data-action="kid"]');
  if (kidBtn) {
    kidBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keyState["KeyK"] = true;
      kidBtn.classList.add("active");
    }, { passive: false });

    kidBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keyState["KeyK"] = false;
      kidBtn.classList.remove("active");
    }, { passive: false });

    kidBtn.addEventListener("touchcancel", () => {
      keyState["KeyK"] = false;
      kidBtn.classList.remove("active");
    });
  }
}

export function getPlayer1Input(): InputState {
  return {
    left: !!keyState["ArrowLeft"] || !!touchState["left"],
    right: !!keyState["ArrowRight"] || !!touchState["right"],
    up: !!keyState["ArrowUp"] || !!touchState["up"],
    down: !!keyState["ArrowDown"] || !!touchState["down"],
    pepper: !!keyState["Space"] || !!touchState["pepper"],
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
