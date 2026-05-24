/**
 * Default passthrough shaders used when no shaders are provided to
 * <HtmlShader>. The vertex shader draws a full-screen triangle using the
 * gl_VertexID trick (no buffer required). The fragment shader samples the
 * HTML texture as-is, making the canvas a 1:1 window into the DOM content.
 */

export const DEFAULT_VERT = /* glsl */ `#version 300 es
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
`;

/**
 * Internal compositor shader. Samples the HTML texture and overlays any
 * child <canvas> elements (which appear black in texElementImage2D) with
 * their actual GPU content, uploaded separately via texImage2D.
 *
 * Up to MAX_CANVASES (8) child canvases are supported. Each is described
 * by a UV rect (x, y, w, h) in top-left-origin space matching v_uv.
 */
/**
 * Vertex shader for the compositor pass (no Y flip).
 *
 * The default vert flips Y so that v_uv=(0,0) maps to the DOM top-left.
 * That flip makes sense for the final screen output, but when rendering into
 * an FBO the same flip causes the stored texture to have the opposite vertical
 * orientation — so the user's shader reads it upside-down.
 *
 * This variant emits v_uv without the flip, so the FBO texture ends up with
 * the same orientation as the original HTML texture (UV.t=0 = visual top).
 */
export const COMPOSITOR_VERT = /* glsl */ `#version 300 es
out vec2 v_uv;

void main() {
  vec2 pos[3] = vec2[](vec2(-1, -1), vec2(3, -1), vec2(-1, 3));
  gl_Position = vec4(pos[gl_VertexID], 0.0, 1.0);
  v_uv = pos[gl_VertexID] * 0.5 + 0.5;
}
`;

// Helper macro (JS string) — avoids repeating the rect-test + sample logic
// for each slot while keeping every sampler access at a constant index
// (GLSL ES prohibits dynamic indexing of sampler arrays).
function compositorSlot(i: number): string {
  return `
  if (u_canvas_count > ${i}) {
    rect = u_canvas_rects[${i}];
    if (v_uv.x >= rect.x && v_uv.x <= rect.x + rect.z &&
        v_uv.y >= rect.y && v_uv.y <= rect.y + rect.w) {
      color = texture(u_canvases[${i}], (v_uv - rect.xy) / rect.zw);
    }
  }`;
}

export const COMPOSITOR_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_canvases[8];
uniform vec4 u_canvas_rects[8];
uniform int u_canvas_count;

in vec2 v_uv;
out vec4 out_color;

void main() {
  vec4 color = texture(u_texture, v_uv);
  vec4 rect;
${[0, 1, 2, 3, 4, 5, 6, 7].map(compositorSlot).join("")}
  out_color = color;
}
`;

export const DEFAULT_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D u_texture;  // HTML element rendered to GPU
uniform vec2 u_resolution;    // canvas size in physical pixels
uniform float u_time;         // seconds since mount

in vec2 v_uv;
out vec4 out_color;

void main() {
  out_color = texture(u_texture, v_uv);
}
`;
