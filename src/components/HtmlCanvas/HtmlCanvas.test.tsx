import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HtmlCanvas } from "./index.js";

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

describe("HtmlCanvas", () => {
  it("renders a canvas element", () => {
    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas />);
    });
    expect(container.querySelector("canvas")).not.toBeNull();
  });

  it("applies default width and height of 300", () => {
    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas />);
    });
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("width")).toBe("300");
    expect(canvas.getAttribute("height")).toBe("300");
  });

  it("respects explicit width and height props", () => {
    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas width={800} height={450} />);
    });
    const canvas = container.querySelector("canvas")!;
    expect(canvas.getAttribute("width")).toBe("800");
    expect(canvas.getAttribute("height")).toBe("450");
  });

  it("logs an error when WebGL2 is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas />);
    });

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("[refrag] WebGL2 is not supported")
    );
  });

  it("logs an error when the HTML-in-Canvas API is unavailable", () => {
    const glWithoutApi = makeGlMock();
    // Remove texElementImage2D to simulate unsupported browser.
    delete (glWithoutApi as Record<string, unknown>)["texElementImage2D"];

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      glWithoutApi as unknown as WebGL2RenderingContext
    );
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas />);
    });

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("[refrag] The HTML-in-Canvas API is not available")
    );
  });

  it("cancels the rAF loop on unmount", () => {
    const glMock = makeGlMock();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      glMock as unknown as WebGL2RenderingContext
    );

    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    act(() => {
      root = createRoot(container);
      root.render(<HtmlCanvas />);
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
      root.render(<HtmlCanvas />);
    });

    act(() => {
      root.unmount();
    });

    expect(glMock.deleteProgram).toHaveBeenCalled();
    expect(glMock.deleteTexture).toHaveBeenCalled();
    expect(glMock.deleteVertexArray).toHaveBeenCalled();
  });
});
