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
