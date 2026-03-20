import React from "react";

const DEFAULT_STORAGE_KEY = "touchpoints.enabled";
const DEFAULT_DOT_SIZE = 40;
const DEFAULT_ACCENT_COLOR = "#0b6bff";
const STYLE_ID = "touchpoints-styles";
const STYLES = `
.touchpoints-root,
.touchpoints-toggle,
.touchpoints-dot {
  --radius: 999px;
  --ease: cubic-bezier(0.215, 0.61, 0.355, 1);
  --dot-bg: rgba(24, 24, 27, 0.22);
  --dot-border: rgba(255, 255, 255, 0.14);
  --dot-shadow: rgba(0, 0, 0, 0.18);
  --toggle-border: hsla(0, 0%, 100%, 0.077);
  --toggle-bg: color-mix(in srgb, #161616 72%, transparent);
  --toggle-fg: #ededed;
  --toggle-shadow: lch(0% 0 0 / 0.03) 0 1px 1px, lch(0% 0 0 / 0.08) 0 2px 4px -2px;
  --toggle-icon-fg: hsla(0, 0%, 100%, 0.249);
}

.touchpoints-root {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  touch-action: none;
}

.touchpoints-dot {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--touchpoints-size);
  height: var(--touchpoints-size);
  border-radius: var(--radius);
  pointer-events: none;
  user-select: none;
  transform: translate3d(
    calc(var(--touchpoints-x) - (var(--touchpoints-size) * 0.5)),
    calc(var(--touchpoints-y) - (var(--touchpoints-size) * 0.5)),
    0
  );
}

.touchpoints-dot-inner {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--dot-bg);
  box-shadow:
    0 0 0 1px var(--dot-border),
    0 10px 30px var(--dot-shadow);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  animation: touchpoints-in 180ms var(--ease) forwards;
}

.touchpoints-toggle {
  position: fixed;
  z-index: 10000;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--toggle-border);
  border-radius: var(--radius);
  background: var(--toggle-bg);
  color: var(--toggle-fg);
  box-shadow: var(--toggle-shadow);
  backdrop-filter: blur(14px) saturate(1.15);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
  pointer-events: auto;
  cursor: pointer;
  user-select: none;
  font:
    500 14px/1 system-ui,
    sans-serif;
}

.touchpoints-toggle[data-position="bottom-left"] {
  left: 16px;
  bottom: 16px;
}

.touchpoints-toggle[data-position="bottom-right"] {
  right: 16px;
  bottom: 16px;
}

.touchpoints-toggle[data-position="top-left"] {
  top: 16px;
  left: 16px;
}

.touchpoints-toggle[data-position="top-right"] {
  top: 16px;
  right: 16px;
}

.touchpoints-toggle-icon {
  width: 16px;
  height: 16px;
  color: var(--toggle-icon-fg);
  transition: color 150ms var(--ease);
}

.touchpoints-toggle[data-enabled="true"] .touchpoints-toggle-icon {
  color: var(--touchpoints-accent);
}

@keyframes touchpoints-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
`;

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

function ensureStyles() {
  if (typeof document === "undefined") {
    return;
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");

  style.id = STYLE_ID;
  style.textContent = STYLES;

  document.head.appendChild(style);
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

  React.useInsertionEffect(() => {
    ensureStyles();
  }, []);

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
