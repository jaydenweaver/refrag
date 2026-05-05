import type { RefCallback } from "react";

export interface UseHtmlTextureResult {
  /**
   * Attach to the HTML element you want rendered as a WebGL texture.
   * The element will be appended as a direct canvas child (required by spec).
   *
   * @example
   * ```tsx
   * const { ref, texture } = useHtmlTexture(gl);
   * return <div ref={ref}>Hello</div>;
   * ```
   */
  ref: RefCallback<HTMLElement>;

  /**
   * The WebGL texture handle. `null` until the element has been painted at
   * least once. The handle is stable — only the GPU-side content changes.
   */
  texture: WebGLTexture | null;

  /** Manually schedule a re-paint, e.g. after a programmatic DOM mutation. */
  requestPaint: () => void;

  /** `false` when `texElementImage2D` is unavailable; hook is inert. */
  isSupported: boolean;
}
