"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { HtmlInCanvasElement, WebGL2RenderingContextWithHtml } from "../../types.js";
import type { UseHtmlTextureResult } from "./types.js";
import { addPaintListener, removePaintListener } from "./utils.js";

// React Compiler safe

/**
 * Low-level escape hatch: renders an HTML element into a WebGL texture using
 * the HTML-in-Canvas API. Attach the returned `ref` to any HTML element and
 * the hook manages the canvas child lifecycle, `onpaint` subscription, and
 * GPU upload automatically.
 *
 * For most use cases prefer `<HtmlCanvas>` which handles WebGL setup too.
 *
 * @example
 * ```tsx
 * const { gl } = useMyWebGLContext();
 * const { ref, texture, isSupported } = useHtmlTexture(gl);
 *
 * return <div ref={ref} style={{ width: 512, height: 256 }}>Hello</div>;
 * ```
 *
 * @see https://github.com/WICG/html-in-canvas
 */
export function useHtmlTexture(gl: WebGL2RenderingContext | null): UseHtmlTextureResult {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [texture, setTexture] = useState<WebGLTexture | null>(null);
  // Stable ref so the onpaint callback always reaches the live texture handle.
  const textureRef = useRef<WebGLTexture | null>(null);

  const ref = useCallback((node: HTMLElement | null) => setElement(node), []);

  const isSupported =
    gl !== null && "texElementImage2D" in (gl as WebGL2RenderingContextWithHtml);

  useLayoutEffect(() => {
    if (!gl || !element) return;

    const glHtml = gl as WebGL2RenderingContextWithHtml;
    if (!("texElementImage2D" in glHtml)) return;

    const canvas = gl.canvas as HtmlInCanvasElement;

    const tex = gl.createTexture();
    if (!tex) return;
    textureRef.current = tex;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (!canvas.layoutSubtree) canvas.layoutSubtree = true;

    if (element.parentNode !== canvas) canvas.appendChild(element);

    const upload = () => {
      const t = textureRef.current;
      if (!t) return;
      gl.bindTexture(gl.TEXTURE_2D, t);
      glHtml.texElementImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, element);
      gl.bindTexture(gl.TEXTURE_2D, null);
      // Only update state once so consumers that key on texture identity
      // don't re-render on every paint.
      setTexture((prev) => prev ?? t);
    };

    addPaintListener(canvas, element, upload);
    canvas.requestPaint();

    return () => {
      removePaintListener(canvas, element);
      if (element.parentNode === canvas) canvas.removeChild(element);
      gl.deleteTexture(tex);
      textureRef.current = null;
      setTexture(null);
    };
  }, [gl, element]);

  const requestPaint = useCallback(() => {
    if (!gl) return;
    const canvas = gl.canvas as HtmlInCanvasElement;
    if ("requestPaint" in canvas) canvas.requestPaint();
  }, [gl]);

  return { ref, texture, requestPaint, isSupported };
}
