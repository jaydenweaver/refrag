#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_shock_pos;
uniform float u_shock_t;

in vec2 v_uv;
out vec4 out_color;

void main() {
  float duration  = 1.2;  // seconds — how long the wave travels
  float maxRadius = 0.6;  // 0–1 — how far the ring expands
  float strength  = 0.03; // 0–0.1 — peak displacement amount

  vec2 uv = v_uv;

  if (u_shock_t < duration) {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 delta = (uv - u_shock_pos) * vec2(aspect, 1.0);
    float dist = length(delta);

    float progress  = u_shock_t / duration;
    float radius    = progress * maxRadius;
    float ringWidth = mix(0.06, 0.005, progress);
    float disp      = mix(strength, 0.0, progress);

    float ring = max(0.0, 1.0 - abs(dist - radius) / ringWidth);
    ring = smoothstep(0.0, 1.0, ring);

    vec2 dir = dist > 0.001 ? normalize(delta) / vec2(aspect, 1.0) : vec2(0.0);
    uv += dir * ring * disp;
  }

  out_color = texture(u_texture, clamp(uv, 0.001, 0.999));
}
