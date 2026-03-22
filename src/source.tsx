import React from "react";

import "./styles.css";

const DEFAULT_DOT_SIZE = 40;

interface Point {
  id: number;
  x: number;
  y: number;
}

interface TouchPointsProps {
  size?: number;
  color?: string;
  border?: string;
}

function useHydration() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function useTouchPoints() {
  const [points, setPoints] = React.useState<Point[]>([]);

  const pointsRef = React.useRef(new Map<number, Point>());
  const frameRef = React.useRef<number | null>(null);

  const hydrated = useHydration();

  React.useEffect(() => {
    function cancelFrame() {
      if (frameRef.current === null) {
        return;
      }

      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    function flushPoints() {
      frameRef.current = null;
      setPoints(Array.from(pointsRef.current.values()));
    }

    function scheduleFlush() {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = requestAnimationFrame(flushPoints);
    }

    function clearPoints() {
      if (pointsRef.current.size === 0) {
        cancelFrame();
        setPoints((current) => (current.length === 0 ? current : []));
        return;
      }

      pointsRef.current.clear();
      cancelFrame();
      setPoints([]);
    }

    function resetPoints() {
      pointsRef.current.clear();
      cancelFrame();
    }

    if (!hydrated) {
      clearPoints();
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") {
        return;
      }

      pointsRef.current.set(event.pointerId, {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });
      scheduleFlush();
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType !== "touch") {
        return;
      }

      const point = pointsRef.current.get(event.pointerId);

      if (!point) {
        return;
      }

      pointsRef.current.set(event.pointerId, {
        ...point,
        x: event.clientX,
        y: event.clientY,
      });
      scheduleFlush();
    }

    function handlePointerEnd(event: PointerEvent) {
      if (!pointsRef.current.has(event.pointerId)) {
        return;
      }

      pointsRef.current.delete(event.pointerId);
      scheduleFlush();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        clearPoints();
      }
    }

    const controller = new AbortController();
    const options = {
      passive: true,
      signal: controller.signal,
    };

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
      resetPoints();
    };
  }, [hydrated]);

  return {
    hydrated,
    points,
  };
}

export function TouchPoints({
  size = DEFAULT_DOT_SIZE,
  color,
  border,
}: TouchPointsProps) {
  const { hydrated, points } = useTouchPoints();

  if (!hydrated) {
    return null;
  }

  const rootStyle = {
    "--touchpoints-size": `${size}px`,
    ...(color ? { "--dot-bg": color } : {}),
    ...(border ? { "--touchpoints-border": border } : {}),
  } as React.CSSProperties;

  return (
    <div className="touchpoints-root" aria-hidden style={rootStyle}>
      {points.map(({ id, x, y }) => (
        <div
          key={id}
          className="touchpoints-dot"
          style={
            {
              ...rootStyle,
              "--touchpoints-x": `${x}px`,
              "--touchpoints-y": `${y}px`,
            } as React.CSSProperties
          }
        >
          <div className="touchpoints-dot-inner" />
        </div>
      ))}
    </div>
  );
}
