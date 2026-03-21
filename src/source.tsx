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
  const hydrated = useHydration();

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        return;
      }

      setPoints((current) =>
        current
          .filter((point) => point.id !== event.pointerId)
          .concat({
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          }),
      );
    }

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerType === "mouse") {
        return;
      }

      setPoints((current) =>
        current.map((point) =>
          point.id === event.pointerId
            ? { ...point, x: event.clientX, y: event.clientY }
            : point,
        ),
      );
    }

    function handlePointerEnd(event: PointerEvent) {
      setPoints((current) =>
        current.filter((point) => point.id !== event.pointerId),
      );
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

    return () => {
      controller.abort();
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
