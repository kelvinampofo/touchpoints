import { act } from "react";
import React from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

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

function getRoot() {
  return document.querySelector(".touchpoints-root");
}

function getDotCount() {
  return document.querySelectorAll(".touchpoints-dot").length;
}

function getDot(index = 0) {
  return document.querySelectorAll<HTMLElement>(".touchpoints-dot")[index] ?? null;
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
  it("should render the overlay after hydration", async () => {
    const view = await render(<TouchPoints />);

    await waitFor(() => {
      expect(getRoot()).not.toBeNull();
    });

    view.unmount();
  });

  it("should render touch markers for touch pointer events", async () => {
    const view = await render(<TouchPoints />);

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

  it("should ignore non-touch pointers", async () => {
    const view = await render(<TouchPoints />);

    act(() => {
      window.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 40,
          clientY: 50,
          pointerId: 1,
          pointerType: "mouse",
        }),
      );
      window.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 60,
          clientY: 70,
          pointerId: 2,
          pointerType: "pen",
        }),
      );
    });

    await waitFor(() => {
      expect(getDotCount()).toBe(0);
    });

    view.unmount();
  });

  it("should update touch marker positions on pointer move", async () => {
    const view = await render(<TouchPoints />);

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
        new PointerEvent("pointermove", {
          clientX: 180,
          clientY: 220,
          pointerId: 1,
          pointerType: "touch",
        }),
      );
    });

    await waitFor(() => {
      expect(getDot()?.style.getPropertyValue("--touchpoints-x")).toBe("180px");
      expect(getDot()?.style.getPropertyValue("--touchpoints-y")).toBe("220px");
    });

    view.unmount();
  });

  it("should clear active markers on page blur", async () => {
    const view = await render(<TouchPoints />);

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
      window.dispatchEvent(new Event("blur"));
    });

    await waitFor(() => {
      expect(getDotCount()).toBe(0);
    });

    view.unmount();
  });

  it("should clear active markers when the document becomes hidden", async () => {
    const view = await render(<TouchPoints />);

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

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => {
      expect(getDotCount()).toBe(0);
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });

    view.unmount();
  });
});
