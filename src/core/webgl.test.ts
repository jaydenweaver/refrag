import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProgram } from "./webgl.js";

function makeMockGl(overrides?: Partial<Record<string, unknown>>) {
  const gl = {
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
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
    ...overrides,
  } as unknown as WebGL2RenderingContext;
  return gl;
}

describe("createProgram", () => {
  let gl: WebGL2RenderingContext;

  beforeEach(() => {
    gl = makeMockGl();
  });

  it("returns a program when shaders compile and link successfully", () => {
    const program = createProgram(gl, "vert source", "frag source");
    expect(program).toBeTruthy();
    expect(gl.createProgram).toHaveBeenCalled();
    expect(gl.linkProgram).toHaveBeenCalled();
  });

  it("deletes both shaders after linking regardless of outcome", () => {
    createProgram(gl, "vert source", "frag source");
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it("throws with vertex label when vertex shader fails to compile", () => {
    gl = makeMockGl({
      getShaderParameter: vi.fn((_, param) =>
        param === 35713 ? false : true
      ),
      getShaderInfoLog: vi.fn(() => "unexpected token"),
    });

    expect(() => createProgram(gl, "bad vert", "frag source")).toThrowError(
      /vertex shader compile error/
    );
  });

  it("includes the info log in the vertex shader error", () => {
    gl = makeMockGl({
      getShaderParameter: vi.fn(() => false),
      getShaderInfoLog: vi.fn(() => "unexpected token"),
    });

    expect(() => createProgram(gl, "bad vert", "frag source")).toThrowError(
      /unexpected token/
    );
  });

  it("throws with fragment label when fragment shader fails to compile", () => {
    // First shader (vert) passes, second (frag) fails.
    let callCount = 0;
    gl = makeMockGl({
      getShaderParameter: vi.fn(() => {
        callCount++;
        return callCount === 1; // vert passes, frag fails
      }),
      getShaderInfoLog: vi.fn(() => "undeclared identifier"),
    });

    expect(() => createProgram(gl, "vert source", "bad frag")).toThrowError(
      /fragment shader compile error/
    );
  });

  it("throws when program fails to link", () => {
    gl = makeMockGl({
      getProgramParameter: vi.fn(() => false),
      getProgramInfoLog: vi.fn(() => "varying mismatch"),
    });

    expect(() => createProgram(gl, "vert source", "frag source")).toThrowError(
      /Program link error.*varying mismatch/s
    );
  });

  it("throws when createShader returns null", () => {
    gl = makeMockGl({ createShader: vi.fn(() => null) });
    expect(() => createProgram(gl, "vert source", "frag source")).toThrowError(
      /Failed to allocate shader/
    );
  });

  it("throws when createProgram returns null", () => {
    gl = makeMockGl({ createProgram: vi.fn(() => null) });
    expect(() => createProgram(gl, "vert source", "frag source")).toThrowError(
      /Failed to allocate program/
    );
  });
});
