import "./source.css";

import React from "react";

const DEFAULT_STORAGE_KEY = "touchpoints.enabled";
const DEFAULT_DOT_SIZE = 40;
const DEFAULT_ACCENT_COLOR = "#0b6bff";

interface Point {
  id: number;
  x: number;
  y: number;
}

type TouchPointPosition =
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

interface TouchPointsProps {
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  hideToggle?: boolean;
  size?: number;
  accentColor?: string;
  position?: TouchPointPosition;
}

function resolvePersistedEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const persisted = window.localStorage.getItem(DEFAULT_STORAGE_KEY);

  if (persisted === "true") return true;
  if (persisted === "false") return false;

  return false;
}

function useHydration() {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

function useIsTouchDevice(hydrated: boolean) {
  const [isCoarsePointer, setIsCoarsePointer] = React.useState(false);

  React.useEffect(() => {
    if (!hydrated) {
      return;
    }

    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => {
      setIsCoarsePointer(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, [hydrated]);

  return isCoarsePointer;
}

function useEnabledState({
  enabled: controlledEnabled,
  hydrated,
  onEnabledChange,
}: {
  enabled: boolean | undefined;
  hydrated: boolean;
  onEnabledChange: ((enabled: boolean) => void) | undefined;
}) {
  const [uncontrolledEnabled, setUncontrolledEnabled] = React.useState(false);

  const isControlled = controlledEnabled !== undefined;
  const enabled = isControlled ? controlledEnabled : uncontrolledEnabled;

  React.useEffect(() => {
    if (!hydrated || isControlled) {
      return;
    }

    setUncontrolledEnabled(resolvePersistedEnabled());
  }, [hydrated, isControlled]);

  React.useEffect(() => {
    if (!hydrated || isControlled) return;

    window.localStorage.setItem(
      DEFAULT_STORAGE_KEY,
      enabled ? "true" : "false",
    );
  }, [enabled, hydrated, isControlled]);

  function toggleEnabled() {
    const nextEnabled = !enabled;

    if (isControlled) {
      onEnabledChange?.(nextEnabled);
      return;
    }

    setUncontrolledEnabled(nextEnabled);
  }

  return {
    enabled,
    isToggleInteractive: !isControlled || onEnabledChange !== undefined,
    toggleEnabled,
  };
}

function useTouchPoints({
  enabled: controlledEnabled,
  onEnabledChange,
}: {
  enabled: boolean | undefined;
  onEnabledChange: ((enabled: boolean) => void) | undefined;
}) {
  const hydrated = useHydration();
  const isCoarsePointer = useIsTouchDevice(hydrated);
  const { enabled, isToggleInteractive, toggleEnabled } = useEnabledState({
      enabled: controlledEnabled,
      hydrated,
      onEnabledChange,
    });

  const [points, setPoints] = React.useState<Point[]>([]);

  React.useEffect(() => {
    if (!enabled) {
      setPoints([]);
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
  }, [enabled]);

  return {
    enabled,
    hydrated,
    isCoarsePointer,
    isToggleInteractive,
    points,
    toggleEnabled,
  };
}

export function TouchPoints({
  enabled,
  onEnabledChange,
  hideToggle = false,
  size = DEFAULT_DOT_SIZE,
  accentColor = DEFAULT_ACCENT_COLOR,
  position = "bottom-right",
}: TouchPointsProps) {
  const {
    enabled: isEnabled,
    hydrated,
    isCoarsePointer,
    isToggleInteractive,
    points,
    toggleEnabled,
  } = useTouchPoints({
    enabled,
    onEnabledChange,
  });

  const shouldShowToggle =
    hydrated &&
    !hideToggle &&
    isToggleInteractive &&
    (isCoarsePointer || isEnabled);

  if (!hydrated) {
    return null;
  }

  const rootStyle = {
    "--touchpoints-size": `${size}px`,
    "--touchpoints-accent": accentColor,
  } as React.CSSProperties;

  return (
    <>
      {shouldShowToggle ? (
        <button
          type="button"
          className="touchpoints-toggle"
          data-enabled={isEnabled}
          data-position={position}
          onClick={toggleEnabled}
          aria-pressed={isEnabled}
          aria-label={`${isEnabled ? "Disable" : "Enable"} touch points`}
          style={rootStyle}
        >
          <TouchIcon className="touchpoints-toggle-icon" />
          <span>Touches</span>
        </button>
      ) : null}

      {isEnabled ? (
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
      ) : null}
    </>
  );
}

function TouchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 15 15" fill="none" aria-hidden {...props}>
      <path
        d="M7.5 0C7.8 0 8 0.2 8 0.5V1.8C10.7 2.1 12.8 4.3 13 7H14.5C14.8 7 15 7.2 15 7.5C15 7.8 14.8 8 14.5 8H13C12.7 10.6 10.6 12.7 8 13V14.5C8 14.8 7.8 15 7.5 15C7.2 15 7 14.8 7 14.5V13C4.3 12.8 2.1 10.7 1.8 8H0.5C0.2 8 0 7.8 0 7.5C0 7.2 0.2 7 0.5 7H1.8C2 4.2 4.2 2 7 1.8V0.5C7 0.2 7.2 0 7.5 0ZM8 12V9.5C8 9.2 7.8 9 7.5 9C7.2 9 7 9.2 7 9.5V12.1C4.8 11.9 3 10.2 2.8 8H5.5C5.8 8 6 7.8 6 7.5C6 7.2 5.8 7 5.5 7H2.7C2.9 4.7 4.7 2.9 7 2.7V5.5C7 5.8 7.2 6 7.5 6C7.8 6 8 5.8 8 5.5V2.8C10.2 3 11.9 4.8 12.1 7H9.5C9.2 7 9 7.2 9 7.5C9 7.8 9.2 8 9.5 8H12C11.8 10.1 10.1 11.8 8 12Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      />
    </svg>
  );
}
