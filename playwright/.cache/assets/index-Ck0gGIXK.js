import { g as getDefaultExportFromCjs, r as requireReactDom, a as reactExports } from './index-C-9igzxv.js';

var jsxRuntime$2 = {exports: {}};

var reactJsxRuntime_production = {};

/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var hasRequiredReactJsxRuntime_production;

function requireReactJsxRuntime_production () {
	if (hasRequiredReactJsxRuntime_production) return reactJsxRuntime_production;
	hasRequiredReactJsxRuntime_production = 1;
	"use strict";
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"),
	  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
	  var key = null;
	  void 0 !== maybeKey && (key = "" + maybeKey);
	  void 0 !== config.key && (key = "" + config.key);
	  if ("key" in config) {
	    maybeKey = {};
	    for (var propName in config)
	      "key" !== propName && (maybeKey[propName] = config[propName]);
	  } else maybeKey = config;
	  config = maybeKey.ref;
	  return {
	    $$typeof: REACT_ELEMENT_TYPE,
	    type: type,
	    key: key,
	    ref: void 0 !== config ? config : null,
	    props: maybeKey
	  };
	}
	reactJsxRuntime_production.Fragment = REACT_FRAGMENT_TYPE;
	reactJsxRuntime_production.jsx = jsxProd;
	reactJsxRuntime_production.jsxs = jsxProd;
	return reactJsxRuntime_production;
}

var jsxRuntime$1 = jsxRuntime$2.exports;

var hasRequiredJsxRuntime;

function requireJsxRuntime () {
	if (hasRequiredJsxRuntime) return jsxRuntime$2.exports;
	hasRequiredJsxRuntime = 1;
	"use strict";
	if (true) {
	  jsxRuntime$2.exports = requireReactJsxRuntime_production();
	} else {
	  module.exports = require("./cjs/react-jsx-runtime.development.js");
	}
	return jsxRuntime$2.exports;
}

var jsxRuntimeExports = requireJsxRuntime();
const jsxRuntime = /*@__PURE__*/getDefaultExportFromCjs(jsxRuntimeExports);

var reactDomExports = requireReactDom();
const index = /*@__PURE__*/getDefaultExportFromCjs(reactDomExports);

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("[refrag] Failed to allocate shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown error";
    gl.deleteShader(shader);
    const label = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    throw new Error(`[refrag] ${label} shader compile error:
${log}`);
  }
  return shader;
}
function createProgram(gl, vert, frag) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  const program = gl.createProgram();
  if (!program) throw new Error("[refrag] Failed to allocate program.");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown error";
    gl.deleteProgram(program);
    throw new Error(`[refrag] Program link error:
${log}`);
  }
  return program;
}

const DEFAULT_VERT = (
  /* glsl */
  `#version 300 es
out vec2 v_uv;

void main() {
  // Full-screen triangle: three vertices cover the entire clip space.
  // The GPU clips to the viewport, no geometry buffer needed.
  vec2 pos[3] = vec2[](vec2(-1, -1), vec2(3, -1), vec2(-1, 3));
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
  // Flip Y: WebGL origin is bottom-left, DOM/texture origin is top-left.
  vec2 uv = pos[gl_VertexID] * 0.5 + 0.5;
  v_uv = vec2(uv.x, 1.0 - uv.y);
}
`
);
const DEFAULT_FRAG = (
  /* glsl */
  `#version 300 es
precision highp float;

uniform sampler2D u_texture;  // HTML element rendered to GPU
uniform vec2 u_resolution;    // canvas size in physical pixels
uniform float u_time;         // seconds since mount

in vec2 v_uv;
out vec4 out_color;

void main() {
  out_color = texture(u_texture, v_uv);
}
`
);

"use client";
function isApiSupported() {
  if (typeof document === "undefined") return true;
  const probe = document.createElement("canvas");
  const gl = probe.getContext("webgl2");
  return gl !== null && "texElementImage2D" in gl;
}
const HtmlShader = reactExports.forwardRef(
  function HtmlShader2({ frag, vert, width, height, children, className, style, uniforms, animated = true }, ref) {
    const [canvasEl, setCanvasEl] = reactExports.useState(null);
    const [contentEl, setContentEl] = reactExports.useState(null);
    const onCanvasRef = reactExports.useCallback((node) => setCanvasEl(node), []);
    const onContentRef = reactExports.useCallback((node) => setContentEl(node), []);
    const glRef = reactExports.useRef(null);
    const programRef = reactExports.useRef(null);
    const uniformsRef = reactExports.useRef(null);
    const mouseRef = reactExports.useRef([0.5, 0.5]);
    const mouseDownRef = reactExports.useRef(0);
    const mouseInsideRef = reactExports.useRef(0);
    const customUniformsRef = reactExports.useRef(uniforms ?? []);
    customUniformsRef.current = uniforms ?? [];
    const animatedRef = reactExports.useRef(animated);
    animatedRef.current = animated;
    const [cssSize, setCssSize] = reactExports.useState({ width: 0, height: 0 });
    reactExports.useImperativeHandle(
      ref,
      () => ({
        canvas: canvasEl,
        gl: glRef.current,
        requestPaint() {
          if (!canvasEl) return;
          const c = canvasEl;
          if ("requestPaint" in c) c.requestPaint();
        }
      }),
      [canvasEl]
    );
    reactExports.useLayoutEffect(() => {
      if (!canvasEl) return;
      const applySize = (cssW, cssH) => {
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
    reactExports.useLayoutEffect(() => {
      if (!canvasEl || !contentEl) return;
      const gl = canvasEl.getContext("webgl2");
      if (!gl) {
        console.error("[refrag] WebGL2 is not supported in this browser.");
        return;
      }
      glRef.current = gl;
      const glHtml = gl;
      if (!("texElementImage2D" in glHtml)) {
        console.error(
          "[refrag] The HTML-in-Canvas API is not available. Enable the Chromium origin trial or use a supported browser build. See: https://github.com/WICG/html-in-canvas"
        );
        return;
      }
      const vao = gl.createVertexArray();
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      const htmlCanvas = canvasEl;
      if (!htmlCanvas.layoutSubtree) htmlCanvas.layoutSubtree = true;
      htmlCanvas.onpaint = (event) => {
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
          if ("requestPaint" in htmlCanvas) htmlCanvas.requestPaint();
          gl.bindTexture(gl.TEXTURE_2D, null);
          return;
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        if (!animatedRef.current) rafId = requestAnimationFrame(draw);
      };
      if ("requestPaint" in htmlCanvas) htmlCanvas.requestPaint();
      const onPointerMove = (e) => {
        const rect = canvasEl.getBoundingClientRect();
        mouseRef.current = [
          (e.clientX - rect.left) / rect.width,
          (e.clientY - rect.top) / rect.height
        ];
      };
      const onPointerDown = () => {
        mouseDownRef.current = 1;
      };
      const onPointerUp = () => {
        mouseDownRef.current = 0;
      };
      const onPointerEnter = () => {
        mouseInsideRef.current = 1;
      };
      const onPointerLeave = () => {
        mouseInsideRef.current = 0;
        mouseDownRef.current = 0;
      };
      canvasEl.addEventListener("pointermove", onPointerMove);
      canvasEl.addEventListener("pointerdown", onPointerDown);
      canvasEl.addEventListener("pointerup", onPointerUp);
      canvasEl.addEventListener("pointerenter", onPointerEnter);
      canvasEl.addEventListener("pointerleave", onPointerLeave);
      const startTime = performance.now();
      let rafId;
      const draw = () => {
        const program = programRef.current;
        const uniforms2 = uniformsRef.current;
        if (!program || !uniforms2) {
          rafId = requestAnimationFrame(draw);
          return;
        }
        const t = (performance.now() - startTime) / 1e3;
        gl.viewport(0, 0, canvasEl.width, canvasEl.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniforms2.uTexture, 0);
        gl.uniform2f(uniforms2.uResolution, canvasEl.width, canvasEl.height);
        gl.uniform1f(uniforms2.uTime, t);
        gl.uniform2f(uniforms2.uMouse, mouseRef.current[0], mouseRef.current[1]);
        gl.uniform1f(uniforms2.uMouseDown, mouseDownRef.current);
        gl.uniform1f(uniforms2.uMouseInside, mouseInsideRef.current);
        gl.uniform1f(uniforms2.uDpr, window.devicePixelRatio || 1);
        for (const u of customUniformsRef.current) {
          const loc = gl.getUniformLocation(program, u.name);
          if (!loc) continue;
          const v = u.value;
          if (typeof v === "boolean") {
            gl.uniform1f(loc, v ? 1 : 0);
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
        gl.deleteTexture(texture);
        gl.deleteVertexArray(vao);
        glRef.current = null;
      };
    }, [canvasEl, contentEl]);
    reactExports.useLayoutEffect(() => {
      const gl = glRef.current;
      if (!gl) return;
      let program;
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
        uDpr: gl.getUniformLocation(program, "u_dpr")
      };
      if (prev) gl.deleteProgram(prev);
      return () => {
        gl.deleteProgram(program);
        programRef.current = null;
        uniformsRef.current = null;
      };
    }, [canvasEl, contentEl, frag, vert]);
    if (!isApiSupported()) return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "canvas",
        {
          ref: onCanvasRef,
          className,
          style: { display: "block", width, height, ...style }
        }
      ),
      canvasEl && reactDomExports.createPortal(
        // Direct canvas child required by the spec, sized to the CSS layout
        // box so HTML content and mouse position share the same coordinate space.
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            ref: onContentRef,
            style: { width: cssSize.width, height: cssSize.height, overflow: "hidden" },
            children
          }
        ),
        canvasEl
      )
    ] });
  }
);
HtmlShader.displayName = "HtmlShader";

export { HtmlShader };
//# sourceMappingURL=index-Ck0gGIXK.js.map
