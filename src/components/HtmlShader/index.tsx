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
import { COMPOSITOR_FRAG, COMPOSITOR_VERT, DEFAULT_FRAG, DEFAULT_VERT } from "../../shaders/defaults.js";
import type { HtmlInCanvasElement, PaintEvent, WebGL2RenderingContextWithHtml } from "../../types.js";
import type { CustomUniform, HtmlShaderHandle, HtmlShaderProps } from "./types.js";

// Maximum number of child <canvas> elements that can be composited per frame.
const MAX_CANVASES = 8;

type CompositorUniforms = {
  uTexture: WebGLUniformLocation | null;
  uCanvasCount: WebGLUniformLocation | null;
  uCanvases: (WebGLUniformLocation | null)[];
  uCanvasRects: (WebGLUniformLocation | null)[];
};

// React Compiler safe

// TODO: support custom events passed as props (e.g. scroll, keyboard, gamepad)
// so users can drive their own uniforms without forking the component.

// Cached at module level — probing on every render leaks WebGL contexts.
// The probe context is explicitly released so it doesn't count against the limit.
let _apiSupported: boolean | null = null;

function isApiSupported(): boolean {
  if (_apiSupported !== null) return _apiSupported;
  if (typeof document === "undefined") return true; // SSR: defer to client
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2", { preserveDrawingBuffer: true });
  _apiSupported = gl !== null && "texElementImage2D" in gl;
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return _apiSupported;
}

export type { CustomUniform, HtmlShaderHandle, HtmlShaderProps };

type Uniforms = {
  uTexture: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uMouse: WebGLUniformLocation | null;
  uMouseDown: WebGLUniformLocation | null;
  uMouseInside: WebGLUniformLocation | null;
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
 * When the HTML-in-Canvas API is not available the component renders its
 * children directly with no canvas or shader applied, so content remains
 * visible in unsupported browsers.
 *
 * Standard uniforms provided automatically:
 * - `uniform sampler2D u_texture`   — the HTML content
 * - `uniform vec2 u_resolution`     — canvas buffer size in device pixels
 * - `uniform float u_time`          — seconds since mount
 * - `uniform vec2 u_mouse`          — pointer position, normalized 0–1 (last known position when outside)
 * - `uniform float u_mouse_down`    — 1.0 while a pointer button is held, 0.0 otherwise
 * - `uniform float u_mouse_inside`  — 1.0 while the pointer is over the canvas, 0.0 otherwise
 * - `uniform float u_dpr`           — devicePixelRatio
 *
 * @example
 * ```tsx
 * import frag from './ripple.frag?raw';
 *
 * <HtmlShader frag={frag} width={800} height={600}>
 *   <div className="card">Hello from the DOM</div>
 * </HtmlShader>
 * ```
 *
 * @see https://github.com/WICG/html-in-canvas
 */
export const HtmlShader = forwardRef<HtmlShaderHandle, HtmlShaderProps>(
  function HtmlShader(
    { frag, vert, width, height, children, className, style, uniforms, animated = true },
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
    // 1.0 while the pointer is inside the canvas, 0.0 otherwise.
    const mouseInsideRef = useRef(0);

    // Latest custom uniforms — written every render so the draw loop always reads
    // the current values without needing to restart or re-subscribe.
    const customUniformsRef = useRef<CustomUniform[]>(uniforms ?? []);
    customUniformsRef.current = uniforms ?? [];

    const animatedRef = useRef(animated);
    animatedRef.current = animated;

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
    //
    // We read the initial dimensions synchronously via getBoundingClientRect so
    // that setCssSize is called (and React flushes it) before the core WebGL
    // useLayoutEffect runs. This guarantees the content portal div has the
    // correct size when the first requestPaint() fires, preventing a blank frame.
    // The ResizeObserver handles subsequent resizes (e.g. window resize).
    useLayoutEffect(() => {
      if (!canvasEl) return;

      const applySize = (cssW: number, cssH: number) => {
        const dpr = window.devicePixelRatio || 1;
        canvasEl.width = Math.round(cssW * dpr);
        canvasEl.height = Math.round(cssH * dpr);
        setCssSize({ width: cssW, height: cssH });
      };

      const { width: initW, height: initH } = canvasEl.getBoundingClientRect();
      if (initW > 0 && initH > 0) applySize(initW, initH);

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width: cssW, height: cssH } = entry.contentRect;
        applySize(cssW, cssH);
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

      const gl = canvasEl.getContext("webgl2", { preserveDrawingBuffer: true });
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

      // Create and configure the HTML texture once; content is uploaded on each paint.
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);

      // --- Child canvas compositing ---
      // Child <canvas> elements appear black in texElementImage2D because their
      // WebGL/2D content lives on a separate GPU layer. We detect them via
      // MutationObserver, upload their pixels each frame via texImage2D, and
      // composite them into the HTML texture in a pre-pass before running the
      // user's shader.

      // FBO + render texture for the compositor output.
      const fbo = gl.createFramebuffer();
      const fboTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, fboTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTexture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Compile the fixed compositor program (never changes, not user-provided).
      let compProgram: WebGLProgram | null = null;
      let compUniforms: CompositorUniforms | null = null;
      try {
        compProgram = createProgram(gl, COMPOSITOR_VERT, COMPOSITOR_FRAG);
        compUniforms = {
          uTexture: gl.getUniformLocation(compProgram, "u_texture"),
          uCanvasCount: gl.getUniformLocation(compProgram, "u_canvas_count"),
          uCanvases: Array.from({ length: MAX_CANVASES }, (_, i) =>
            gl.getUniformLocation(compProgram!, `u_canvases[${i}]`)
          ),
          uCanvasRects: Array.from({ length: MAX_CANVASES }, (_, i) =>
            gl.getUniformLocation(compProgram!, `u_canvas_rects[${i}]`)
          ),
        };
      } catch (err) {
        console.error("[refrag] Failed to compile compositor shader:", err);
      }

      // Tracks the current FBO texture dimensions to resize it when the canvas grows.
      let fboTexW = 1;
      let fboTexH = 1;

      // Mutable list of detected child canvases and their per-canvas textures.
      let childCanvases: HTMLCanvasElement[] = [];
      const canvasTextures = new Map<HTMLCanvasElement, WebGLTexture>();

      const addChildCanvas = (canvas: HTMLCanvasElement) => {
        if (canvasTextures.has(canvas)) return;
        const tex = gl.createTexture();
        if (!tex) return;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        canvasTextures.set(canvas, tex);
        childCanvases = [...childCanvases, canvas];
      };

      const removeChildCanvas = (canvas: HTMLCanvasElement) => {
        const tex = canvasTextures.get(canvas);
        if (tex) gl.deleteTexture(tex);
        canvasTextures.delete(canvas);
        childCanvases = childCanvases.filter((c) => c !== canvas);
      };

      // Scan children already in the DOM at mount time (handles SSR-hydrated trees).
      contentEl.querySelectorAll("canvas").forEach((c) => addChildCanvas(c as HTMLCanvasElement));

      const childObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLCanvasElement) addChildCanvas(node);
            else if (node instanceof Element)
              node.querySelectorAll("canvas").forEach((c) => addChildCanvas(c as HTMLCanvasElement));
          }
          for (const node of mutation.removedNodes) {
            if (node instanceof HTMLCanvasElement) removeChildCanvas(node);
            else if (node instanceof Element)
              node.querySelectorAll("canvas").forEach((c) => removeChildCanvas(c as HTMLCanvasElement));
          }
        }
      });
      childObserver.observe(contentEl, { childList: true, subtree: true });
      // --- End child canvas compositing setup ---

      // Opt the canvas into HTML-in-Canvas layout.
      const htmlCanvas = canvasEl as HtmlInCanvasElement;
      if (!htmlCanvas.layoutSubtree) htmlCanvas.layoutSubtree = true;

      // Re-upload the HTML content to GPU whenever the browser repaints it.
      // In static mode, also schedule a one-shot draw so the new texture is rendered.
      htmlCanvas.onpaint = (event: PaintEvent) => {
        if (!event.changedElements.some((el) => contentEl === el || contentEl.contains(el))) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        try {
          glHtml.texElementImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            contentEl
          );
        } catch {
          // The paint record was evicted between onpaint firing and the upload
          // (e.g. a composited scroll/transform sidesteps the paint cycle).
          // Keep the previous frame's texture and request another paint to self-heal.
          if ("requestPaint" in htmlCanvas) htmlCanvas.requestPaint();
          gl.bindTexture(gl.TEXTURE_2D, null);
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (!animatedRef.current) rafId = requestAnimationFrame(draw);
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
      const onPointerEnter = () => { mouseInsideRef.current = 1; };
      const onPointerLeave = () => {
        mouseInsideRef.current = 0;
        mouseDownRef.current = 0;
      };

      canvasEl.addEventListener("pointermove", onPointerMove);
      canvasEl.addEventListener("pointerdown", onPointerDown);
      canvasEl.addEventListener("pointerup", onPointerUp);
      canvasEl.addEventListener("pointerenter", onPointerEnter);
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

        // Determine which texture feeds the user's shader.
        // When child canvases are present, run a compositor pre-pass that
        // fills the black holes left by texElementImage2D and outputs to an FBO.
        let userTexture = texture;

        if (childCanvases.length > 0 && compProgram && compUniforms && fbo && fboTexture) {
          // Upload each child canvas's current pixel content.
          for (const childCanvas of childCanvases) {
            const tex = canvasTextures.get(childCanvas);
            if (!tex) continue;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, childCanvas);
            gl.bindTexture(gl.TEXTURE_2D, null);
          }

          // Resize FBO texture to match the canvas if needed.
          if (fboTexW !== canvasEl.width || fboTexH !== canvasEl.height) {
            gl.bindTexture(gl.TEXTURE_2D, fboTexture);
            gl.texImage2D(
              gl.TEXTURE_2D, 0, gl.RGBA,
              canvasEl.width, canvasEl.height, 0,
              gl.RGBA, gl.UNSIGNED_BYTE, null
            );
            gl.bindTexture(gl.TEXTURE_2D, null);
            fboTexW = canvasEl.width;
            fboTexH = canvasEl.height;
          }

          // Compositor pass: HTML texture + child canvas textures → FBO.
          gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
          gl.viewport(0, 0, canvasEl.width, canvasEl.height);
          // eslint-disable-next-line react-compiler/react-compiler -- gl.useProgram is a WebGL method, not a React hook
          gl.useProgram(compProgram);
          gl.bindVertexArray(vao);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(compUniforms.uTexture, 0);

          const contentRect = contentEl.getBoundingClientRect();
          const count = Math.min(childCanvases.length, MAX_CANVASES);
          gl.uniform1i(compUniforms.uCanvasCount, count);

          for (let i = 0; i < count; i++) {
            const childCanvas = childCanvases[i];
            if (!childCanvas) continue;
            const tex = canvasTextures.get(childCanvas);
            if (!tex) continue;

            gl.activeTexture(gl.TEXTURE0 + 1 + i);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(compUniforms.uCanvases[i] ?? null, 1 + i);

            // UV rect of this child canvas relative to contentEl, in top-left-origin space.
            const cr = childCanvas.getBoundingClientRect();
            gl.uniform4f(
              compUniforms.uCanvasRects[i] ?? null,
              (cr.left - contentRect.left) / contentRect.width,
              (cr.top - contentRect.top) / contentRect.height,
              cr.width / contentRect.width,
              cr.height / contentRect.height
            );
          }

          gl.drawArrays(gl.TRIANGLES, 0, 3);
          gl.bindVertexArray(null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);

          userTexture = fboTexture;
        }

        // User shader pass.
        gl.viewport(0, 0, canvasEl.width, canvasEl.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // eslint-disable-next-line react-compiler/react-compiler -- gl.useProgram is a WebGL method, not a React hook
        gl.useProgram(program);
        gl.bindVertexArray(vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, userTexture);
        gl.uniform1i(uniforms.uTexture, 0);
        gl.uniform2f(uniforms.uResolution, canvasEl.width, canvasEl.height);
        gl.uniform1f(uniforms.uTime, t);
        gl.uniform2f(uniforms.uMouse, mouseRef.current[0], mouseRef.current[1]);
        gl.uniform1f(uniforms.uMouseDown, mouseDownRef.current);
        gl.uniform1f(uniforms.uMouseInside, mouseInsideRef.current);
        gl.uniform1f(uniforms.uDpr, window.devicePixelRatio || 1);

        for (const u of customUniformsRef.current) {
          const loc = gl.getUniformLocation(program, u.name);
          if (!loc) continue;
          const v = u.value;
          if (typeof v === "boolean") {
            gl.uniform1f(loc, v ? 1.0 : 0.0);
          } else if (typeof v === "number") {
            gl.uniform1f(loc, v);
          } else if (v.length === 2) {
            gl.uniform2f(loc, v[0], v[1]);
          } else if (v.length === 3) {
            gl.uniform3f(loc, v[0], v[1], v[2]);
          } else if (v.length === 4) {
            gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
          }
        }

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindVertexArray(null);
        if (animatedRef.current) rafId = requestAnimationFrame(draw);
      };

      rafId = requestAnimationFrame(draw);

      return () => {
        cancelAnimationFrame(rafId);
        canvasEl.removeEventListener("pointermove", onPointerMove);
        canvasEl.removeEventListener("pointerdown", onPointerDown);
        canvasEl.removeEventListener("pointerup", onPointerUp);
        canvasEl.removeEventListener("pointerenter", onPointerEnter);
        canvasEl.removeEventListener("pointerleave", onPointerLeave);
        htmlCanvas.onpaint = null;
        childObserver.disconnect();
        for (const tex of canvasTextures.values()) gl.deleteTexture(tex);
        gl.deleteFramebuffer(fbo);
        gl.deleteTexture(fboTexture);
        if (compProgram) gl.deleteProgram(compProgram);
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
        uMouseInside: gl.getUniformLocation(program, "u_mouse_inside"),
        uDpr: gl.getUniformLocation(program, "u_dpr"),
      };

      if (prev) gl.deleteProgram(prev);

      return () => {
        gl.deleteProgram(program);
        programRef.current = null;
        uniformsRef.current = null;
      };
    }, [canvasEl, contentEl, frag, vert]);

    // All hooks have been called — safe to return early now.
    if (!isApiSupported()) return <>{children}</>;

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

HtmlShader.displayName = "HtmlShader";
