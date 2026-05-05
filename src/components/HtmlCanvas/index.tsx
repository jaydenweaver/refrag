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

const MIN_SIZE = 300;

/**
 * Renders HTML children as a WebGL texture on a `<canvas>` using the
 * HTML-in-Canvas API. Plug in your own fragment shader to apply effects —
 * the HTML content is available as `u_texture`.
 *
 * Standard uniforms provided automatically:
 * - `uniform sampler2D u_texture`  — the HTML content
 * - `uniform vec2 u_resolution`    — canvas size in pixels
 * - `uniform float u_time`         — seconds since mount
 * - `uniform vec2 u_mouse`         — cursor position, normalized 0–1 (starts at 0.5, 0.5)
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
    { frag, vert, width = MIN_SIZE, height = MIN_SIZE, children, className, style },
    ref
  ) {
    // Two-phase mount: canvas ref first, then portal content ref.
    // Both must be in the DOM before WebGL setup can proceed.
    const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
    const [contentEl, setContentEl] = useState<HTMLDivElement | null>(null);

    const onCanvasRef = useCallback((node: HTMLCanvasElement | null) => setCanvasEl(node), []);
    const onContentRef = useCallback((node: HTMLDivElement | null) => setContentEl(node), []);

    const glRef = useRef<WebGL2RenderingContext | null>(null);
    // Normalized [0,1] mouse position within the canvas. Starts centered.
    const mouseRef = useRef<readonly [number, number]>([0.5, 0.5]);

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

      let program: WebGLProgram;
      try {
        program = createProgram(gl, vert ?? DEFAULT_VERT, frag ?? DEFAULT_FRAG);
      } catch (err) {
        console.error(err);
        return;
      }

      const uTexture = gl.getUniformLocation(program, "u_texture");
      const uResolution = gl.getUniformLocation(program, "u_resolution");
      const uTime = gl.getUniformLocation(program, "u_time");
      const uMouse = gl.getUniformLocation(program, "u_mouse");

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvasEl.getBoundingClientRect();
        mouseRef.current = [
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height,
        ];
      };
      canvasEl.addEventListener("mousemove", onMouseMove);

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

      // Continuous draw loop so time-based shader effects animate smoothly.
      const startTime = performance.now();
      let rafId: number;

      const draw = () => {
        const t = (performance.now() - startTime) / 1000;

        gl.viewport(0, 0, canvasEl.width, canvasEl.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uTexture, 0);
        gl.uniform2f(uResolution, canvasEl.width, canvasEl.height);
        gl.uniform1f(uTime, t);
        gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindVertexArray(null);
        rafId = requestAnimationFrame(draw);
      };

      rafId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(rafId);
        canvasEl.removeEventListener("mousemove", onMouseMove);
        htmlCanvas.onpaint = null;
        gl.deleteTexture(texture);
        gl.deleteProgram(program);
        gl.deleteVertexArray(vao);
        glRef.current = null;
      };
    }, [canvasEl, contentEl, frag, vert]);

    return (
      <>
        <canvas
          ref={onCanvasRef}
          width={width}
          height={height}
          className={className}
          style={style}
        />
        {canvasEl &&
          createPortal(
            // This div is the direct canvas child required by the spec.
            // position:absolute + inset:0 makes it cover the canvas exactly,
            // matching the coordinate space used by texElementImage2D.
            <div ref={onContentRef} style={{ position: "absolute", inset: 0 }}>
              {children}
            </div>,
            canvasEl
          )}
      </>
    );
  }
);

HtmlCanvas.displayName = "HtmlCanvas";
