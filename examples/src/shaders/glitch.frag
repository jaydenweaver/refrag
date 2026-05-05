#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_mouse_down;
uniform float u_mouse_inside;

in vec2 v_uv;
out vec4 out_color;

// Cheap hash for pseudo-random values.
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}

void main() {
  vec2 uv = v_uv;

  // Glitch intensity: idle when outside, spikes on mouse down.
  float intensity = 0.015 * u_mouse_inside + u_mouse_down * 0.12;

  // Horizontal slice glitch: shift random rows at irregular intervals.
  float sliceT    = floor(u_time * 8.0);
  float sliceY    = floor(uv.y * 40.0);
  float sliceRand = hash(sliceY + sliceT * 13.7);
  float sliceOn   = step(1.0 - intensity * 3.0, sliceRand);
  float sliceShift = (hash(sliceY * 3.1 + sliceT) * 2.0 - 1.0) * intensity;
  uv.x += sliceShift * sliceOn;

  // RGB split: fixed axis offset scaled by intensity.
  float split = intensity * 0.6;
  float r = texture(u_texture, uv + vec2( split, 0.0)).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv + vec2(-split, 0.0)).b;
  float a = texture(u_texture, uv).a;

  vec4 color = vec4(r, g, b, a);

  // Scanlines.
  float scan = sin(uv.y * u_resolution.y * 1.5) * 0.04;
  color.rgb -= scan;

  out_color = color;
}
