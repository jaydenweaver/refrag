import type { HtmlInCanvasElement, PaintEvent } from "../../types.js";

/**
 * Per-canvas registry of active paint listeners.
 *
 * Multiple useHtmlTexture instances on the same canvas must not clobber each
 * other's onpaint handler. A WeakMap keyed on the canvas element ensures the
 * registry is GC'd with the canvas — no manual map cleanup needed.
 */
const paintRegistry = new WeakMap<HTMLCanvasElement, Map<HTMLElement, () => void>>();

export function addPaintListener(
  canvas: HtmlInCanvasElement,
  element: HTMLElement,
  handler: () => void
): void {
  if (!paintRegistry.has(canvas)) {
    paintRegistry.set(canvas, new Map());
    canvas.onpaint = (event: PaintEvent) => {
      const listeners = paintRegistry.get(canvas);
      if (!listeners) return;
      for (const [el, cb] of listeners) {
        if (event.changedElements.includes(el)) cb();
      }
    };
  }
  paintRegistry.get(canvas)!.set(element, handler);
}

export function removePaintListener(canvas: HtmlInCanvasElement, element: HTMLElement): void {
  const listeners = paintRegistry.get(canvas);
  if (!listeners) return;
  listeners.delete(element);
  if (listeners.size === 0) {
    canvas.onpaint = null;
    paintRegistry.delete(canvas);
  }
}
