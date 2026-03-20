import { act } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { TouchPoints } from "../src/source";

async function render(ui: React.ReactNode) {
  const container = document.createElement("div");
  const root = createRoot(container);

  document.body.appendChild(container);

  await act(async () => {
    root.render(ui);
  });

  return {
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

function getToggle() {
  return document.querySelector<HTMLButtonElement>(".touchpoints-toggle");
}

function requireToggle() {
  const toggle = getToggle();

  expect(toggle).not.toBeNull();

  return toggle as HTMLButtonElement;
}

function getDotCount() {
  return document.querySelectorAll(".touchpoints-dot").length;
}

function waitFor(assertion: () => void, timeout = 1000) {
  const startedAt = Date.now();

  return new Promise<void>((resolve, reject) => {
    function check() {
      try {
        assertion();
        resolve();
      } catch (error) {
        if (Date.now() - startedAt >= timeout) {
          reject(error);
          return;
        }

        setTimeout(check, 10);
      }
    }

    check();
  });
}

describe("<TouchPoints />", () => {
  it("should toggle uncontrolled state and persist it", async () => {
    const view = await render(<TouchPoints />);

    await waitFor(() => {
      requireToggle();
    });

    const toggle = requireToggle();

    expect(toggle.getAttribute("aria-pressed")).toBe("false");

    act(() => {
      toggle.click();
    });

    await waitFor(() => {
      expect(toggle.getAttribute("aria-pressed")).toBe("true");
    });

    expect(window.localStorage.getItem("touchpoints.enabled")).toBe("true");
    view.unmount();
  });

  it("should hydrate from persisted local storage state", async () => {
    window.localStorage.setItem("touchpoints.enabled", "true");

    const view = await render(<TouchPoints />);

    await waitFor(() => {
      requireToggle();
    });

    const toggle = requireToggle();

    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Disable touch points");
    view.unmount();
  });

  it("should call onEnabledChange in controlled mode", async () => {
    const onEnabledChange = vi.fn();

    const view = await render(
      <TouchPoints enabled={false} onEnabledChange={onEnabledChange} />,
    );

    await waitFor(() => {
      requireToggle();
    });

    act(() => {
      requireToggle().click();
    });

    expect(onEnabledChange).toHaveBeenCalledWith(true);
    view.unmount();
  });

  it("should hide the toggle when hideToggle is true", async () => {
    const view = await render(<TouchPoints hideToggle />);

    await waitFor(() => {
      expect(getToggle()).toBeNull();
    });

    view.unmount();
  });

  it("should render touch markers for touch pointer events only when enabled", async () => {
    const view = await render(<TouchPoints />);

    await waitFor(() => {
      requireToggle();
    });

    act(() => {
      requireToggle().click();
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 120,
          clientY: 160,
          pointerId: 1,
          pointerType: "touch",
        }),
      );
    });

    await waitFor(() => {
      expect(getDotCount()).toBe(1);
    });

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerup", {
          clientX: 120,
          clientY: 160,
          pointerId: 1,
          pointerType: "touch",
        }),
      );
    });

    await waitFor(() => {
      expect(getDotCount()).toBe(0);
    });

    view.unmount();
  });
});
