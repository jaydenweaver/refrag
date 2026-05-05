/**
 * Type augmentations for the HTML-in-Canvas experimental API (WICG proposal).
 * @see https://github.com/WICG/html-in-canvas
 */

/**
 * Fired by a canvas element when any of its direct children need to be
 * re-painted. Handlers may call `drawElementImage()` / `texElementImage2D()`
 * within the same microtask to capture the current frame.
 */
export interface PaintEvent extends Event {
  /** Elements whose rendered output changed since the last paint. */
  readonly changedElements: ReadonlyArray<Element>;
}

/**
 * A `<canvas>` element that has opted into the HTML-in-Canvas API via
 * `layoutSubtree = true`. Its direct children participate in layout,
 * hit-testing, and the `onpaint` lifecycle.
 */
export interface HtmlInCanvasElement extends HTMLCanvasElement {
  /**
   * Opts the canvas into HTML-in-Canvas mode. When `true`, direct children
   * form their own stacking context, become a containing block for descendants,
   * and have paint containment.
   */
  layoutSubtree: boolean;

  /**
   * Invoked when a paint event occurs. Use this to re-upload changed elements
   * to GPU memory. Setting to `null` removes the listener.
   */
  onpaint: ((event: PaintEvent) => void) | null;

  /**
   * Schedules a paint, analogous to `requestAnimationFrame` for canvas
   * children. Useful for forcing an initial upload or responding to
   * programmatic changes.
   */
  requestPaint(): void;
}

/**
 * A `WebGL2RenderingContext` extended with the HTML-in-Canvas texture upload
 * method. Only present when the browser supports the API.
 */
export type WebGL2RenderingContextWithHtml = WebGL2RenderingContext & {
  /**
   * Uploads an HTML element's rendered output directly into the currently
   * bound WebGL texture, bypassing the usual `texImage2D` path.
   *
   * @see https://github.com/WICG/html-in-canvas
   */
  texElementImage2D(
    target: GLenum,
    level: GLint,
    internalformat: GLint,
    format: GLenum,
    type: GLenum,
    element: Element
  ): void;
};
