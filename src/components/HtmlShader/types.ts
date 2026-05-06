import type { CSSProperties, ReactNode } from "react";

/**
 * A custom uniform to pass to the fragment/vertex shader.
 *
 * | `value` type          | GLSL type        |
 * |-----------------------|------------------|
 * | `boolean`             | `float` (0 or 1) |
 * | `number`              | `float`          |
 * | `[number, number]`    | `vec2`           |
 * | `[number, number, number]` | `vec3`      |
 * | `[number, number, number, number]` | `vec4` |
 *
 * @example
 * ```tsx
 * uniforms={[
 *   { name: "u_active", value: true },
 *   { name: "u_strength", value: 0.8 },
 *   { name: "u_color", value: [1, 0.5, 0.2] },
 * ]}
 * ```
 */
export interface CustomUniform {
  name: string;
  value: boolean | number | readonly [number, number] | readonly [number, number, number] | readonly [number, number, number, number];
}

export interface HtmlShaderProps {
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

  /**
   * CSS width of the canvas (e.g. `640` or `"100%"`).
   * The pixel buffer automatically tracks the rendered size via ResizeObserver.
   * If omitted, size the canvas via CSS or a `className`.
   */
  width?: number | string;

  /**
   * CSS height of the canvas (e.g. `420` or `"100vh"`).
   * The pixel buffer automatically tracks the rendered size via ResizeObserver.
   * If omitted, size the canvas via CSS or a `className`.
   */
  height?: number | string;

  /**
   * Custom uniforms to upload each frame. Booleans map to `float` 1.0/0.0.
   * Changes are picked up automatically — no re-mount required.
   *
   * @example
   * ```tsx
   * uniforms={[{ name: "u_active", value: isActive }, { name: "u_strength", value: 0.8 }]}
   * ```
   */
  uniforms?: CustomUniform[];

  /**
   * Whether to run a continuous requestAnimationFrame loop.
   *
   * Set to `false` for static shaders that don't use `u_time` or any other
   * time-varying uniforms. The canvas will only redraw when the HTML content
   * changes (via `onpaint`) rather than every frame.
   *
   * @default true
   */
  animated?: boolean;

  className?: string;
  style?: CSSProperties;

  /**
   * HTML content to render as a WebGL texture. Rendered into the canvas as a
   * direct DOM child (required by the HTML-in-Canvas spec) via a React portal.
   */
  children?: ReactNode;
}

/** Imperative handle exposed via `ref` for advanced control. */
export interface HtmlShaderHandle {
  /** The underlying `<canvas>` element. */
  canvas: HTMLCanvasElement | null;
  /** The WebGL2 rendering context. */
  gl: WebGL2RenderingContext | null;
  /** Manually schedule a re-paint of the HTML content. */
  requestPaint: () => void;
}
