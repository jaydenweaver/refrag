"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { createProgram } from "../../core/webgl.js";
import { DEFAULT_FRAG, DEFAULT_VERT } from "../../shaders/defaults.js";
import type { HtmlInCanvasElement, PaintEvent, WebGL2RenderingContextWithHtml } from "../../types.js";
import type { HtmlCanvasHandle, HtmlCanvasProps } from "./types.js";

// React Compiler safe

export type { HtmlCanvasHandle, HtmlCanvasProps };

type Uniforms = {
  uTexture: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uMouse: WebGLUniformLocation | null;
  uMouseDown: WebGLUniformLocation | null;
  uDpr: WebGLUniformLocation | null;
};

/**
 * Renders HTML children as a WebGL texture on a `<canvas>` using the
 * HTML-in-Canvas API. Plug in your own fragment shader to apply effects —
 * the HTML content is available as `u_texture`.
 *
 * Size the canvas with `width`/`height` props (CSS pixels) or via CSS.
 * The pixel buffer and wrapper div automatically track the canvas's
 * rendered size via ResizeObserver, so the canvas is always sharp on
 * HiDPI screens and responds to layout changes.
 *
 * Standard uniforms provided automatically:
 * - `uniform sampler2D u_texture`   — the HTML content
 * - `uniform vec2 u_resolution`     — canvas buffer size in device pixels
 * - `uniform float u_time`          — seconds since mount
 * - `uniform vec2 u_mouse`          — pointer position, normalized 0–1 (resets to 0.5,0.5 on leave)
 * - `uniform float u_mouse_down`    — 1.0 while a pointer button is held, 0.0 otherwise
 * - `uniform float u_dpr`           — devicePixelRatio
 *
 * @example
 * ```tsx
 * import frag from './ripple.frag?raw';
 *
 * <HtmlCanvas frag={frag} width={800} height={600}>
 *   <div className="card">Hello from the DOM</div>
 * </HtmlCanvas>
 * ```
 *
 * @see https://github.com/WICG/html-in-canvas
 */
export const HtmlCanvas = forwardRef<HtmlCanvasHandle, HtmlCanvasProps>(
  function HtmlCanvas(
    { frag, vert, width, height, children, className, style },
    ref
  ) {
    // Two-phase mount: canvas ref first, then portal content ref.
    // Both must be in the DOM before WebGL setup can proceed.
    const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
    const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);

    const onCanvasRef = useCallback((node: HTMLCanvasElement | null) => setCanvasEl(node), []);
    const onContentRef = useCallback((node: HTMLDivElement | null) => setContentEl(node), []);

    const glRef = useRef<WebGL2RenderingContext | null>(null);
    // Shader program and uniform locations are kept in refs so the draw loop
    // and the shader-recompile effect can share them without restarting the loop.
    const programRef = useRef<WebGLProgram | null>(null);
    const uniformsRef = useRef<Uniforms | null>(null);
    // Normalized [0,1] pointer position within the canvas. Starts centered.
    const mouseRef = useRef<readonly [number, number]>([0.5, 0.5]);
    // 1.0 while any pointer button is pressed, 0.0 otherwise.
    const mouseDownRef = useRef(0);

    // CSS pixel dimensions of the canvas layout box, observed via ResizeObserver.
    // Drives the wrapper div size so HTML content matches the canvas coordinate space.
    const [cssSize, setCssSize] = useState({ width: 0, height: 0 });

    useImperativeHandle(
      ref,
      () => ({
        canvas: canvasEl,
        gl: glRef.current,
        requestPaint() {
          if (!canvasEl) return;
          const c = canvasEl as HtmlInCanvasElement;
          if ("requestPaint" in c) c.requestPaint();
        },
      }),
      [canvasEl]
    );

    // Sync canvas pixel buffer and wrapper div to the canvas's CSS layout size.
    // Multiplying by devicePixelRatio keeps the buffer sharp on HiDPI screens.
    useLayoutEffect(() => {
      if (!canvasEl) return;

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width: cssW, height: cssH } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvasEl.width = Math.round(cssW * dpr);
        canvasEl.height = Math.round(cssH * dpr);
        setCssSize({ width: cssW, height: cssH });
      });

      ro.observe(canvasEl);
      return () => ro.disconnect();
    }, [canvasEl]);

    // Core WebGL setup: context, texture, onpaint, pointer events, rAF loop.
    // Runs once when both elements are mounted. Intentionally does not depend on
    // frag/vert — shader changes are handled by the effect below so that the
    // texture and onpaint handler survive shader switches without going blank.
    useLayoutEffect(() => {
      if (!canvasEl || !contentEl) return;

      const gl = canvasEl.getContext("webgl2");
      if (!gl) {
        console.error("[refrag] WebGL2 is not supported in this browser.");
        return;
      }
      glRef.current = gl;

      const glHtml = gl as WebGL2RenderingContextWithHtml;
      if (!("texElementImage2D" in glHtml)) {
        console.error(
          "[refrag] The HTML-in-Canvas API is not available. " +
            "Enable the Chromium origin trial or use a supported browser build. " +
            "See: https://github.com/WICG/html-in-canvas"
        );
        return;
      }

      // Empty VAO required by WebGL2 for vertex-ID-based draws.
      const vao = gl.createVertexArray();

      // Create and configure the texture once; content is uploaded on each paint.
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      // Opt the canvas into HTML-in-Canvas layout.
      const htmlCanvas = canvasEl as HtmlInCanvasElement;
      if (!htmlCanvas.layoutSubtree) htmlCanvas.layoutSubtree = true;

      // Re-upload the HTML content to GPU whenever the browser repaints it.
      htmlCanvas.onpaint = (event: PaintEvent) => {
        if (!event.changedElements.includes(contentEl)) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        glHtml.texElementImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          contentEl
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
      };

      if ("requestPaint" in htmlCanvas) htmlCanvas.requestPaint();

      const onPointerMove = (e: PointerEvent) => {
        const rect = canvasEl.getBoundingClientRect();
        mouseRef.current = [
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
        ];
      };
      const onPointerDown = () => { mouseDownRef.current = 1; };
      const onPointerUp = () => { mouseDownRef.current = 0; };
      // Reset position and pressed state when pointer leaves so shaders don't
      // freeze on the last known value.
      const onPointerLeave = () => {
        mouseRef.current = [0.5, 0.5];
        mouseDownRef.current = 0;
      };

      canvasEl.addEventListener("pointermove", onPointerMove);
      canvasEl.addEventListener("pointerdown", onPointerDown);
      canvasEl.addEventListener("pointerup", onPointerUp);
      canvasEl.addEventListener("pointerleave", onPointerLeave);

      // Continuous draw loop so time-based shader effects animate smoothly.
      const startTime = performance.now();
      let rafId: number;

      const draw = () => {
        const program = programRef.current;
        const uniforms = uniformsRef.current;

        // Skip draw until the shader program is compiled.
        if (!program || !uniforms) {
          rafId = requestAnimationFrame(draw);
          return;
        }

        const t = (performance.now() - startTime) / 1000;

        gl.viewport(0, 0, canvasEl.width, canvasEl.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms.uTexture, 0);
        gl.uniform2f(uniforms.uResolution, canvasEl.width, canvasEl.height);
        gl.uniform1f(uniforms.uTime, t);
        gl.uniform2f(uniforms.uMouse, mouseRef.current[0], mouseRef.current[1]);
        gl.uniform1f(uniforms.uMouseDown, mouseDownRef.current);
        gl.uniform1f(uniforms.uDpr, window.devicePixelRatio || 1);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindVertexArray(null);
        rafId = requestAnimationFrame(draw);
      };

      rafId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(rafId);
        canvasEl.removeEventListener("pointermove", onPointerMove);
        canvasEl.removeEventListener("pointerdown", onPointerDown);
        canvasEl.removeEventListener("pointerup", onPointerUp);
        canvasEl.removeEventListener("pointerleave", onPointerLeave);
        htmlCanvas.onpaint = null;
        gl.deleteTexture(texture);
        gl.deleteVertexArray(vao);
        glRef.current = null;
      };
    }, [canvasEl, contentEl]);

    // Recompile the shader program when frag or vert changes.
    // Runs after the core effect, so glRef is already populated.
    // The rAF loop continues uninterrupted — it just picks up the new program.
    useLayoutEffect(() => {
      const gl = glRef.current;
      if (!gl) return;

      let program: WebGLProgram;
      try {
        program = createProgram(gl, vert ?? DEFAULT_VERT, frag ?? DEFAULT_FRAG);
      } catch (err) {
        console.error(err);
        return;
      }

      const prev = programRef.current;
      programRef.current = program;
      uniformsRef.current = {
        uTexture: gl.getUniformLocation(program, "u_texture"),
        uResolution: gl.getUniformLocation(program, "u_resolution"),
        uTime: gl.getUniformLocation(program, "u_time"),
        uMouse: gl.getUniformLocation(program, "u_mouse"),
        uMouseDown: gl.getUniformLocation(program, "u_mouse_down"),
        uDpr: gl.getUniformLocation(program, "u_dpr"),
      };

      if (prev) gl.deleteProgram(prev);
    }, [canvasEl, contentEl, frag, vert]);

    return (
      <>
        <canvas
          ref={onCanvasRef}
          className={className}
          style={{ display: "block", width, height, ...style }}
        />
        {canvasEl &&
          createPortal(
            // Direct canvas child required by the spec, sized to the CSS layout
            // box so HTML content and mouse position share the same coordinate space.
            <div
              ref={onContentRef}
              style={{ width: cssSize.width, height: cssSize.height, overflow: "hidden" }}
            >
              {children}
            </div>,
            canvasEl
          )}
      </>
    );
  }
);

HtmlCanvas.displayName = "HtmlCanvas";
