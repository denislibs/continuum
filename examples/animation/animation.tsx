import { constant, integral, warp, type Behavior } from "@continuum/frp";
import { animationFrames } from "@continuum/dom";

const TRACK = 260; // px travel before wrapping
const SPEED = 0.1; // px per ms

/**
 * Continuous time on working code: position is the `integral` of velocity over
 * the animation clock. The red box runs on a warped clock (`t → 2t`), so it
 * covers twice the distance in the same wall-clock time.
 */
export function TimeWarpDemo() {
  const ticks = animationFrames();
  const v = constant(SPEED);

  const xNormal = integral(v, ticks);
  const xFast = integral(v, warp(ticks, (t) => t * 2));

  const track = (x: Behavior<number>, color: string) => {
    const boxStyle = x.map((px) => ({
      position: "absolute",
      width: "24px",
      height: "24px",
      borderRadius: "4px",
      background: color,
      transform: `translateX(${Math.round(px) % TRACK}px)`,
    }));
    return (
      <div
        class="track"
        style={{
          position: "relative",
          height: "32px",
          width: `${TRACK + 24}px`,
          margin: "8px 0",
          background: "#f1f5f9",
          borderRadius: "6px",
        }}
      >
        <div style={boxStyle} />
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <h3>Continuum — integral + time warp</h3>
      {track(xNormal, "#3b82f6")}
      {track(xFast, "#ef4444")}
      <p>
        Синий — реальное время. Красный — <code>warp(t → 2t)</code>, вдвое
        быстрее. Позиция = <code>integral(velocity)</code> по клоку кадров.
      </p>
    </div>
  );
}
