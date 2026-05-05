/**
 * Vanilla WebGL2 utilities used internally by refrag.
 * These are intentionally framework-agnostic so they can be tested
 * and reused without React.
 */

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("[refrag] Failed to allocate shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "unknown error";
    gl.deleteShader(shader);
    const label = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
    throw new Error(`[refrag] ${label} shader compile error:\n${log}`);
  }

  return shader;
}

/**
 * Compiles a vertex + fragment shader pair and links them into a program.
 * Shaders are detached and deleted after linking — the program owns them.
 *
 * @throws if compilation or linking fails, with the full info log attached.
 */
export function createProgram(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);

  const program = gl.createProgram();
  if (!program) throw new Error("[refrag] Failed to allocate program.");

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  // Safe to delete after linking regardless of outcome.
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "unknown error";
    gl.deleteProgram(program);
    throw new Error(`[refrag] Program link error:\n${log}`);
  }

  return program;
}
