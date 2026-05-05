import type { CSSProperties, ReactNode } from "react";

export interface HtmlCanvasProps {
  /**
   * Raw GLSL fragment shader source. Import your `.glsl` file with `?raw`:
   * ```ts
   * import frag from './ripple.frag?raw';
   * ```
   * Defaults to a passthrough shader that renders the HTML content as-is.
   */
  frag?: string;

  /**
   * Raw GLSL vertex shader source.
   * Defaults to a full-screen triangle passthrough.
   */
  vert?: string;

  /** Canvas width in CSS pixels. Defaults to `300`. */
  width?: number;

  /** Canvas height in CSS pixels. Defaults to `300`. */
  height?: number;

  className?: string;
  style?: CSSProperties;

  /**
   * HTML content to render as a WebGL texture. Rendered into the canvas as a
   * direct DOM child (required by the HTML-in-Canvas spec) via a React portal.
   */
  children?: ReactNode;
}

/** Imperative handle exposed via `ref` for advanced control. */
export interface HtmlCanvasHandle {
  /** The underlying `<canvas>` element. */
  canvas: HTMLCanvasElement | null;
  /** The WebGL2 rendering context. */
  gl: WebGL2RenderingContext | null;
  /** Manually schedule a re-paint of the HTML content. */
  requestPaint: () => void;
}
