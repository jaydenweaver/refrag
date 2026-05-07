import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlShader } from "./index.js";
import type { CustomUniform } from "./index.js";

// Prevent the rAF draw loop from running during tests.
vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});

function makeGlMock(extra?: Record<string, unknown>) {
  return {
    getUniformLocation: vi.fn(() => null),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ""),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ""),
    deleteProgram: vi.fn(),
    createVertexArray: vi.fn(() => ({})),
    deleteVertexArray: vi.fn(),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    TEXTURE_2D: 3553,
    TEXTURE_MIN_FILTER: 10241,
    TEXTURE_WRAP_S: 10242,
    TEXTURE_WRAP_T: 10243,
    LINEAR: 9729,
    CLAMP_TO_EDGE: 33071,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    // HTML-in-Canvas extension
    texElementImage2D: vi.fn(),
    ...extra,
  };
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.restoreAllMocks();
  // Re-apply the module-level rAF mock after restoreAllMocks.
  vi.spyOn(window, "requestAnimationFrame").mockReturnValue(0);
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
});

describe("HtmlShader", () => {
  it("renders a canvas element", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      makeGlMock() as unknown as WebGL2RenderingContext
    );
    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader />);
    });
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("sets no inline width/height by default", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      makeGlMock() as unknown as WebGL2RenderingContext
    );
    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader />);
    });
    const canvas = container.querySelector("canvas")!;
    // width/height props are applied as CSS, not HTML attributes.
    // When omitted, sizing is left entirely to CSS/the parent layout.
    expect(canvas.style.width).toBe("");
    expect(canvas.style.height).toBe("");
  });

  it("respects explicit width and height props as inline CSS", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      makeGlMock() as unknown as WebGL2RenderingContext
    );
    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader width={800} height={450} />);
    });
    const canvas = container.querySelector("canvas")!;
    expect(canvas.style.width).toBe("800px");
    expect(canvas.style.height).toBe("450px");
  });

  it("renders children directly when WebGL2 is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader><span id="child" /></HtmlShader>);
    });

    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("#child")).not.toBeNull();
  });

  it("renders children directly when the HTML-in-Canvas API is unavailable", () => {
    const glWithoutApi = makeGlMock();
    delete (glWithoutApi as Record<string, unknown>)["texElementImage2D"];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      glWithoutApi as unknown as WebGL2RenderingContext
    );

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader><span id="child" /></HtmlShader>);
    });

    expect(container.querySelector("canvas")).toBeNull();
    expect(container.querySelector("#child")).not.toBeNull();
  });

  it("cancels the rAF loop on unmount", () => {
    const glMock = makeGlMock();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      glMock as unknown as WebGL2RenderingContext
    );

    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader />);
    });

    act(() => {
      root.unmount();
    });

    expect(cancelSpy).toHaveBeenCalled();
  });

  it("deletes WebGL resources on unmount", () => {
    const glMock = makeGlMock();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      glMock as unknown as WebGL2RenderingContext
    );

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader />);
    });

    act(() => {
      root.unmount();
    });

    expect(glMock.deleteProgram).toHaveBeenCalled();
    expect(glMock.deleteTexture).toHaveBeenCalled();
    expect(glMock.deleteVertexArray).toHaveBeenCalled();
  });

  it("re-uploads texture when a descendant of contentEl repaints", () => {
    const gl = makeGlMock();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      gl as unknown as WebGL2RenderingContext
    );

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader />);
    });

    const canvas = container.querySelector("canvas")!;
    // contentEl is the div portaled directly into the canvas.
    const contentEl = canvas.firstElementChild as HTMLElement;
    const child = document.createElement("span");
    contentEl.appendChild(child);

    (gl.texElementImage2D as ReturnType<typeof vi.fn>).mockClear();

    act(() => {
      (canvas as any).onpaint?.({ changedElements: [child] });
    });

    expect(gl.texElementImage2D).toHaveBeenCalledOnce();
  });

  it("calls requestPaint and skips rAF when texElementImage2D throws (evicted paint record)", () => {
    const gl = makeGlMock();
    (gl.texElementImage2D as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("paint record evicted");
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      gl as unknown as WebGL2RenderingContext
    );

    // Add requestPaint before render so the canvas has it when the effect runs.
    const requestPaintSpy = vi.fn();
    (HTMLCanvasElement.prototype as any).requestPaint = requestPaintSpy;

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader animated={false} />);
    });

    const canvas = container.querySelector("canvas")!;
    const contentEl = canvas.firstElementChild as HTMLElement;

    // Clear calls from the initial mount requestPaint.
    requestPaintSpy.mockClear();

    const rafSpy = vi.spyOn(window, "requestAnimationFrame");

    act(() => {
      (canvas as any).onpaint?.({ changedElements: [contentEl] });
    });

    // Must self-heal by requesting another paint.
    expect(requestPaintSpy).toHaveBeenCalledOnce();
    // Must NOT schedule a draw frame — the upload was skipped.
    expect(rafSpy).not.toHaveBeenCalled();

    delete (HTMLCanvasElement.prototype as any).requestPaint;
  });

  it("does not re-queue rAF after drawing when animated={false}", () => {
    const gl = makeDrawGlMock();
    let captured: FrameRequestCallback | null = null;
    const rafSpy = vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      captured = cb;
      return 0;
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      gl as unknown as WebGL2RenderingContext
    );

    act(() => {
      root = createRoot(container);
      root.render(<HtmlShader animated={false} />);
    });

    const callsBefore = rafSpy.mock.calls.length;

    // Fire the initial draw.
    act(() => { captured?.(performance.now()); });

    // rAF should not have been re-queued after the draw completed.
    expect(rafSpy.mock.calls.length).toBe(callsBefore);
  });
});

// Full GL mock that includes all methods called inside the draw loop.
function makeDrawGlMock(uniformLocationOverrides?: Record<string, object>) {
  return {
    ...makeGlMock({
      getUniformLocation: vi.fn((_prog: unknown, name: string) =>
        uniformLocationOverrides?.[name] ?? null
      ),
    }),
    viewport: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    useProgram: vi.fn(),
    bindVertexArray: vi.fn(),
    activeTexture: vi.fn(),
    uniform1i: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniform3f: vi.fn(),
    uniform4f: vi.fn(),
    drawArrays: vi.fn(),
    COLOR_BUFFER_BIT: 16384,
    TEXTURE0: 33984,
    TRIANGLES: 4,
  };
}

/**
 * Mount HtmlShader with a rAF mock that captures (but does not call) the draw
 * callback, then returns a `flush()` helper that invokes it exactly once.
 */
function mountAndCaptureDraw(
  glMock: ReturnType<typeof makeDrawGlMock>,
  uniforms: CustomUniform[]
) {
  let captured: FrameRequestCallback | null = null;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    captured = cb;
    return 0;
  });

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    glMock as unknown as WebGL2RenderingContext
  );

  act(() => {
    root = createRoot(container);
    root.render(<HtmlShader uniforms={uniforms} />);
  });

  return {
    flush() {
      act(() => { captured?.(performance.now()); });
    },
  };
}

describe("HtmlShader uniforms prop", () => {
  it("calls uniform1f for a number uniform", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_strength: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_strength", value: 0.75 }]);
    flush();
    expect(gl.uniform1f).toHaveBeenCalledWith(loc, 0.75);
  });

  it("maps boolean true to 1.0", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_active: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_active", value: true }]);
    flush();
    expect(gl.uniform1f).toHaveBeenCalledWith(loc, 1.0);
  });

  it("maps boolean false to 0.0", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_active: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_active", value: false }]);
    flush();
    expect(gl.uniform1f).toHaveBeenCalledWith(loc, 0.0);
  });

  it("calls uniform2f for a vec2 uniform", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_offset: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_offset", value: [0.1, 0.2] }]);
    flush();
    expect(gl.uniform2f).toHaveBeenCalledWith(loc, 0.1, 0.2);
  });

  it("calls uniform3f for a vec3 uniform", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_color: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_color", value: [1, 0.5, 0.2] }]);
    flush();
    expect(gl.uniform3f).toHaveBeenCalledWith(loc, 1, 0.5, 0.2);
  });

  it("calls uniform4f for a vec4 uniform", () => {
    const loc = {};
    const gl = makeDrawGlMock({ u_tint: loc });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_tint", value: [1, 0, 0, 0.5] }]);
    flush();
    expect(gl.uniform4f).toHaveBeenCalledWith(loc, 1, 0, 0, 0.5);
  });

  it("skips uniforms whose name is not found in the shader", () => {
    // Give built-in float uniforms non-null sentinel locations so we can
    // distinguish their calls from any unexpected custom-uniform call.
    const gl = makeDrawGlMock({
      u_time: {}, u_mouse_down: {}, u_mouse_inside: {}, u_dpr: {},
    });
    const { flush } = mountAndCaptureDraw(gl, [{ name: "u_unknown", value: 1.0 }]);
    flush();
    // The lookup for u_unknown must have happened…
    expect(gl.getUniformLocation).toHaveBeenCalledWith(expect.anything(), "u_unknown");
    // …but because it returned null, no uniform1f call should have a null first arg.
    const calls = (gl.uniform1f.mock.calls as [unknown, number][]);
    expect(calls.some(([loc]) => loc === null)).toBe(false);
  });

  it("uploads multiple uniforms in a single frame", () => {
    const locA = {};
    const locB = {};
    const gl = makeDrawGlMock({ u_a: locA, u_b: locB });
    const { flush } = mountAndCaptureDraw(gl, [
      { name: "u_a", value: 1.0 },
      { name: "u_b", value: [0.5, 0.5] },
    ]);
    flush();
    expect(gl.uniform1f).toHaveBeenCalledWith(locA, 1.0);
    expect(gl.uniform2f).toHaveBeenCalledWith(locB, 0.5, 0.5);
  });
});
