#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_uv;
out vec4 out_color;

void main() {
  vec2 uv = v_uv;

  // Gentle wave distortion driven by time.
  float t = u_time * 0.6;
  float wave = sin(uv.y * 14.0 + t * 2.0) * 0.005
             + sin(uv.y * 7.0  - t * 1.3) * 0.003;

  // Chromatic aberration: shift R and B channels in opposite directions.
  // This makes the effect feel "glassy" rather than just wobbly.
  float r = texture(u_texture, uv + vec2(wave * 1.4, 0.0)).r;
  float g = texture(u_texture, uv + vec2(wave,       0.0)).g;
  float b = texture(u_texture, uv + vec2(wave * 0.6, 0.0)).b;
  float a = texture(u_texture, uv).a;

  out_color = vec4(r, g, b, a);
}
