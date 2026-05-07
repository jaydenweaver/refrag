import { describe, it, expect, vi, beforeEach } from "vitest";
import { addPaintListener, removePaintListener } from "./utils.js";
import type { HtmlInCanvasElement, PaintEvent } from "../../types.js";

function makeMockCanvas(): HtmlInCanvasElement {
  return { onpaint: null } as unknown as HtmlInCanvasElement;
}

function makeMockElement(): HTMLElement {
  return document.createElement("div");
}

function firePaint(canvas: HtmlInCanvasElement, changedElements: Element[]) {
  canvas.onpaint?.({ changedElements } as unknown as PaintEvent);
}

describe("addPaintListener", () => {
  it("installs onpaint on the canvas when adding the first listener", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    addPaintListener(canvas, element, vi.fn());
    expect(canvas.onpaint).toBeTypeOf("function");
  });

  it("does not reinstall onpaint when a second listener is added", () => {
    const canvas = makeMockCanvas();
    addPaintListener(canvas, makeMockElement(), vi.fn());
    const firstHandler = canvas.onpaint;
    addPaintListener(canvas, makeMockElement(), vi.fn());
    expect(canvas.onpaint).toBe(firstHandler);
  });

  it("calls the handler when its element appears in changedElements", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    const handler = vi.fn();
    addPaintListener(canvas, element, handler);
    firePaint(canvas, [element as unknown as Element]);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call the handler for a different element", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    const other = makeMockElement();
    const handler = vi.fn();
    addPaintListener(canvas, element, handler);
    firePaint(canvas, [other as unknown as Element]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls only the matching handler when multiple listeners share a canvas", () => {
    const canvas = makeMockCanvas();
    const elementA = makeMockElement();
    const elementB = makeMockElement();
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    addPaintListener(canvas, elementA, handlerA);
    addPaintListener(canvas, elementB, handlerB);
    firePaint(canvas, [elementA as unknown as Element]);
    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).not.toHaveBeenCalled();
  });
});

describe("descendant repaint (scroll / child state change)", () => {
  it("calls the handler when a descendant appears in changedElements", () => {
    const canvas = makeMockCanvas();
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    const handler = vi.fn();
    addPaintListener(canvas, parent, handler);
    firePaint(canvas, [child]);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not call the handler for an element outside the registered subtree", () => {
    const canvas = makeMockCanvas();
    const registered = document.createElement("div");
    const unrelated = document.createElement("div");
    const handler = vi.fn();
    addPaintListener(canvas, registered, handler);
    firePaint(canvas, [unrelated]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls both handlers when each has a descendant in changedElements", () => {
    const canvas = makeMockCanvas();
    const parentA = document.createElement("div");
    const childA = document.createElement("span");
    parentA.appendChild(childA);
    const parentB = document.createElement("div");
    const childB = document.createElement("span");
    parentB.appendChild(childB);
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    addPaintListener(canvas, parentA, handlerA);
    addPaintListener(canvas, parentB, handlerB);
    firePaint(canvas, [childA, childB]);
    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).toHaveBeenCalledOnce();
  });
});

describe("removePaintListener", () => {
  it("removes the entry so the handler no longer fires", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    const handler = vi.fn();
    addPaintListener(canvas, element, handler);
    removePaintListener(canvas, element);
    firePaint(canvas, [element as unknown as Element]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("clears onpaint when the last listener is removed", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    addPaintListener(canvas, element, vi.fn());
    removePaintListener(canvas, element);
    expect(canvas.onpaint).toBeNull();
  });

  it("leaves onpaint intact when other listeners remain", () => {
    const canvas = makeMockCanvas();
    const elementA = makeMockElement();
    const elementB = makeMockElement();
    addPaintListener(canvas, elementA, vi.fn());
    addPaintListener(canvas, elementB, vi.fn());
    removePaintListener(canvas, elementA);
    expect(canvas.onpaint).toBeTypeOf("function");
  });

  it("is a no-op when called for an unknown canvas", () => {
    const canvas = makeMockCanvas();
    const element = makeMockElement();
    expect(() => removePaintListener(canvas, element)).not.toThrow();
  });
});
