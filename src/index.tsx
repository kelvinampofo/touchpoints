import { useEffect, useRef, useState } from "react";

import "./styles.css";

interface Point {
  id: number;
  x: number;
  y: number;
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
      activePoints.current.clear();

      cancelFrame();
      setPoints([]);
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;

      activePoints.current.set(event.pointerId, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });

      scheduleFlush();
    }

    function handlePointerMove(event: PointerEvent) {
      if (
        event.pointerType !== "touch" ||
        !activePoints.current.has(event.pointerId)
      ) {
        return;
      }

      activePoints.current.set(event.pointerId, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });

      scheduleFlush();
    }

    function handlePointerEnd(event: PointerEvent) {
      if (event.pointerType !== "touch") return;

      if (activePoints.current.delete(event.pointerId)) {
        scheduleFlush();
      }
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
      {points.map(({ id, x, y }) => (
        <div
          key={id}
          className="touchpoints-dot"
          style={{
            "--touchpoints-x": `${x}px`,
            "--touchpoints-y": `${y}px`,
          }}
        />
      ))}
    </div>
  );
}
