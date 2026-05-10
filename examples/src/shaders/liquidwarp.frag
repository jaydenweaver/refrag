#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform float u_time;

in vec2 v_uv;
out vec4 out_color;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0,0)), f),
        dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
    mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)),
        dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x), u.y);
}

void main() {
  float speed    = 0.25;  // animation speed multiplier
  float scale    = 2.5;   // noise frequency (higher = smaller ripples)
  float strength = 0.007; // 0–0.05 — warp displacement amount

  vec2 uv = v_uv;
  float t = u_time * speed;

  vec2 warp;
  warp.x = noise(uv * scale + vec2(t, t * 0.6));
  warp.y = noise(uv * scale + vec2(-t * 0.7, t) + 3.7);
  warp += 0.4 * vec2(
    noise(uv * scale * 2.2 + vec2(t * 1.4, -t * 0.5)),
    noise(uv * scale * 2.2 + vec2(t * 0.6,  t * 1.2) + 8.3)
  );

  out_color = texture(u_texture, clamp(uv + warp * strength, 0.001, 0.999));
}
