#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_inside;

in vec2 v_uv;
out vec4 out_color;

void main() {
  float radius     = 0.20;  // 0–1 — lens radius in UV space
  float strength   = 0.35;  // 0–1 — bulge intensity
  float aberration = 0.012; // 0–0.05 — chromatic aberration amount

  vec2 uv = v_uv;

  // Aspect-corrected vector from current fragment to mouse.
  float aspect = u_resolution.x / u_resolution.y;
  vec2 toMouse = (uv - u_mouse) * vec2(aspect, 1.0);
  float dist = length(toMouse);

  // Smooth bulge lens centered on the cursor, inactive when pointer is outside.
  float falloff = 1.0 - smoothstep(0.0, radius, dist);
  float bulge   = falloff * falloff * strength * u_mouse_inside;
  uv -= (toMouse / vec2(aspect, 1.0)) * bulge;

  // Chromatic aberration that peaks at the lens edge.
  float ca = falloff * (1.0 - falloff) * aberration;
  vec2 dir = normalize(toMouse) / vec2(aspect, 1.0);
  float r = texture(u_texture, uv + dir * ca).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - dir * ca).b;
  float a = texture(u_texture, uv).a;

  out_color = vec4(r, g, b, a);
}
