import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TouchPoints, type TouchPointsProps } from "../src";

const roots = new Set<Root>();

function mount(props: TouchPointsProps = {}) {
  const container = document.body.appendChild(document.createElement("div"));

  const root = createRoot(container);
  roots.add(root);

  act(() => root.render(<TouchPoints {...props} />));
  return root;
}

function pointer(
  type: string,
  pointerId: number,
  clientX = 0,
  clientY = 0,
  pointerType = "touch",
) {
  return new PointerEvent(type, {
    clientX,
    clientY,
    pointerId,
    pointerType,
  });
}

async function dispatch(...events: Event[]) {
  await act(async () => {
    events.forEach((event) => window.dispatchEvent(event));
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
  });
}

function dots() {
  return [...document.querySelectorAll<HTMLElement>(".touchpoints-dot")];
}

afterEach(() => {
  act(() => roots.forEach((root) => root.unmount()));
  roots.clear();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("<TouchPoints />", () => {
  it("exposes its props and applies custom styles", () => {
    const props = {
      size: 48,
      color: "hotpink",
      border: "2px solid blue",
    } satisfies TouchPointsProps;

    mount(props);

    const root = document.querySelector<HTMLElement>(".touchpoints-root");
    expect(root?.style.getPropertyValue("--touchpoints-size")).toBe("48px");
    expect(root?.style.getPropertyValue("--touchpoints-color")).toBe("hotpink");
    expect(root?.style.getPropertyValue("--touchpoints-border")).toBe(
      "2px solid blue",
    );
  });

  it("tracks multiple touches and their movement", async () => {
    mount();

    await dispatch(
      pointer("pointerdown", 1, 120, 160),
      pointer("pointerdown", 2, 220, 260),
    );

    expect(dots()).toHaveLength(2);

    await dispatch(pointer("pointermove", 2, 280, 320));
    expect(dots()[1].style.getPropertyValue("--touchpoints-x")).toBe("280px");
    expect(dots()[1].style.getPropertyValue("--touchpoints-y")).toBe("320px");

    await dispatch(pointer("pointerup", 1), pointer("pointercancel", 2));
    expect(dots()).toHaveLength(0);
  });

  it("ignores mouse, pen, and inactive pointers", async () => {
    mount();

    await dispatch(
      pointer("pointerdown", 1, 0, 0, "mouse"),
      pointer("pointerdown", 2, 0, 0, "pen"),
      pointer("pointermove", 3),
      pointer("pointerup", 3),
    );

    expect(dots()).toHaveLength(0);
  });

  it("clears touches when the page loses visibility", async () => {
    mount();
    await dispatch(pointer("pointerdown", 1));
    expect(dots()).toHaveLength(1);

    await dispatch(new Event("blur"));
    expect(dots()).toHaveLength(0);

    await dispatch(pointer("pointerdown", 1));

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(dots()).toHaveLength(0);

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("clears touches when the page is hidden", async () => {
    mount();
    await dispatch(pointer("pointerdown", 1));
    expect(dots()).toHaveLength(1);

    await dispatch(new Event("pagehide"));
    expect(dots()).toHaveLength(0);
  });

  it("cancels a pending frame when unmounted", () => {
    const requestFrame = vi.spyOn(window, "requestAnimationFrame");
    const cancelFrame = vi.spyOn(window, "cancelAnimationFrame");
    const root = mount();

    act(() => {
      window.dispatchEvent(pointer("pointerdown", 1));
      root.unmount();
    });
    roots.delete(root);

    expect(requestFrame).toHaveBeenCalledOnce();
    expect(cancelFrame).toHaveBeenCalledWith(
      requestFrame.mock.results[0].value,
    );
  });
});
