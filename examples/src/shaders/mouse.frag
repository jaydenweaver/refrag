#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

in vec2 v_uv;
out vec4 out_color;

void main() {
  vec2 uv = v_uv;

  // Aspect-corrected vector from current fragment to mouse.
  float aspect = u_resolution.x / u_resolution.y;
  vec2 toMouse = (uv - u_mouse) * vec2(aspect, 1.0);
  float dist = length(toMouse);

  // Smooth bulge lens centered on the cursor.
  float radius   = 0.2;
  float strength = 0.35;
  float falloff  = 1.0 - smoothstep(0.0, radius, dist);
  float bulge    = falloff * falloff * strength;
  uv -= (toMouse / vec2(aspect, 1.0)) * bulge;

  // Chromatic aberration that peaks at the lens edge.
  float aberration = falloff * (1.0 - falloff) * 0.012;
  vec2 dir = normalize(toMouse) / vec2(aspect, 1.0);
  float r = texture(u_texture, uv + dir * aberration).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - dir * aberration).b;
  float a = texture(u_texture, uv).a;

  out_color = vec4(r, g, b, a);
}
