import { useEffect, useRef, useState } from "react";

import "./styles.css";

interface Point {
  sequence: number;
  x: number;
  y: number;
  released?: boolean;
}

/** Options for customising the touch indicator. */
export interface TouchPointsProps {
  /** Indicator diameter in pixels. @defaultValue 40 */
  size?: number;

  /** CSS color used to fill the indicator. */
  color?: string;

  /** CSS border declaration applied to the indicator. */
  border?: string;
}

function useTouchPoints() {
  const [points, setPoints] = useState<Point[]>([]);

  const activePoints = useRef(new Map<number, Point>());
  const frameId = useRef<number | null>(null);
  const releaseTimers = useRef(
    new Map<number, ReturnType<typeof setTimeout>>(),
  );
  const nextSequence = useRef(0);

  useEffect(() => {
    function cancelFrame() {
      if (frameId.current !== null) {
        cancelAnimationFrame(frameId.current);
        frameId.current = null;
      }
    }

    function flushPoints() {
      frameId.current = null;
      setPoints([...activePoints.current.values()]);
    }

    function scheduleFlush() {
      frameId.current ??= requestAnimationFrame(flushPoints);
    }

    function clearPoints() {
      releaseTimers.current.forEach(clearTimeout);
      releaseTimers.current.clear();
      activePoints.current.clear();

      cancelFrame();
      setPoints([]);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;

      clearTimeout(releaseTimers.current.get(event.pointerId));
      releaseTimers.current.delete(event.pointerId);
      activePoints.current.set(event.pointerId, {
        sequence: nextSequence.current++,
        x: event.clientX,
        y: event.clientY,
      });

      scheduleFlush();
    }

    function handlePointerMove(event: PointerEvent) {
      const point = activePoints.current.get(event.pointerId);
      if (event.pointerType !== "touch" || !point || point.released) {
        return;
      }

      activePoints.current.set(event.pointerId, {
        ...point,
        x: event.clientX,
        y: event.clientY,
      });

      scheduleFlush();
    }

    function handlePointerEnd(event: PointerEvent) {
      if (event.pointerType !== "touch") return;

      const point = activePoints.current.get(event.pointerId);
      if (!point || point.released) return;

      if (event.type === "pointercancel") {
        activePoints.current.delete(event.pointerId);
      } else {
        activePoints.current.set(event.pointerId, { ...point, released: true });
        releaseTimers.current.set(
          event.pointerId,
          setTimeout(() => {
            releaseTimers.current.delete(event.pointerId);
            activePoints.current.delete(event.pointerId);
            scheduleFlush();
          }, 450),
        );
      }

      scheduleFlush();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") clearPoints();
    }

    const controller = new AbortController();
    const options = { passive: true, signal: controller.signal };

    window.addEventListener("pointerdown", handlePointerDown, options);
    window.addEventListener("pointermove", handlePointerMove, options);
    window.addEventListener("pointerup", handlePointerEnd, options);
    window.addEventListener("pointercancel", handlePointerEnd, options);
    window.addEventListener("blur", clearPoints, options);
    window.addEventListener("pagehide", clearPoints, options);

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
      options,
    );

    return () => {
      controller.abort();
      releaseTimers.current.forEach(clearTimeout);
      releaseTimers.current.clear();
      activePoints.current.clear();

      cancelFrame();
    };
  }, []);

  return points;
}

/**
 * Renders an overlay that marks active touch points.
 *
 * Render this once near your application root.
 *
 * @example
 * ```tsx
 * import { TouchPoints } from "touchpoints";
 *
 * export function App() {
 *   return <TouchPoints />;
 * }
 * ```
 */
export function TouchPoints({ size = 40, color, border }: TouchPointsProps) {
  const points = useTouchPoints();

  return (
    <div
      className="touchpoints-root"
      aria-hidden
      style={{
        "--touchpoints-size": `${size}px`,
        "--touchpoints-color": color,
        "--touchpoints-border": border,
      }}
    >
      {points.map(({ sequence, x, y, released }) => (
        <div
          key={sequence}
          className="touchpoints-dot"
          data-released={released || undefined}
          style={{
            "--touchpoints-x": `${x}px`,
            "--touchpoints-y": `${y}px`,
          }}
        />
      ))}
    </div>
  );
}
