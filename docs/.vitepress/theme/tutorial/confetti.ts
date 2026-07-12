// A tiny self-contained confetti burst — no dependency. Spawns a short-lived
// full-screen canvas, throws a few dozen colored rectangles with gravity, and
// removes itself when they settle. Called when a step check passes.
//
// Guards on the DOM/rAF being present so it is a no-op under SSR.

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
}

export function burst(originX?: number, originY?: number): void {
  if (
    typeof document === "undefined" ||
    typeof requestAnimationFrame === "undefined"
  ) {
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  document.body.appendChild(canvas);

  const ox = originX ?? window.innerWidth / 2;
  const oy = originY ?? window.innerHeight / 3;
  const bits: Bit[] = Array.from({ length: 90 }, () => {
    const angle = Math.PI * (1.1 + 0.8 * bitRandom());
    const speed = 6 + bitRandom() * 9;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      rot: bitRandom() * Math.PI,
      vr: (bitRandom() - 0.5) * 0.4,
      size: 5 + bitRandom() * 6,
      color: COLORS[Math.floor(bitRandom() * COLORS.length)],
    };
  });

  let frame = 0;
  function tick() {
    ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (const b of bits) {
      b.vy += 0.3; // gravity
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      ctx!.save();
      ctx!.translate(b.x, b.y);
      ctx!.rotate(b.rot);
      ctx!.fillStyle = b.color;
      ctx!.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.6);
      ctx!.restore();
    }
    frame++;
    if (frame < 120) {
      requestAnimationFrame(tick);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(tick);
}

// Math.random is fine here (pure visual jitter, never persisted or tested).
function bitRandom(): number {
  return Math.random();
}
