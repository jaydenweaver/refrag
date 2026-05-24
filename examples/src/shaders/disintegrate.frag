#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_inside;

in vec2 v_uv;
out vec4 out_color;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

void main() {
  float radius   = 0.22; // 0–1 — affected radius in UV space
  float cellSize = 7.0;  // px — particle cell size at full influence
  float spread   = 0.18; // 0–1 — max fly distance at full influence

  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = v_uv;

  // Distance from mouse in aspect-corrected space
  vec2 delta = (uv - u_mouse) * vec2(aspect, 1.0);
  float dist = length(delta);

  float influence = clamp(1.0 - dist / radius, 0.0, 1.0) * u_mouse_inside;
  influence = influence * influence;

  // Snap nearby fragments into a coarse particle grid
  float cellPx  = mix(1.0, cellSize, influence);
  vec2  cellUV  = floor(uv * u_resolution / cellPx) * cellPx / u_resolution;
  float rng     = hash(cellUV);

  // Each cell flies radially away from the mouse with a random angle offset
  // Oscillate along the fly direction so particles visibly shimmer while held
  float angle = atan(delta.y, delta.x / aspect) + (rng - 0.5) * 1.4;
  float oscillation = sin(u_time * (3.0 + rng * 4.0) + rng * 6.2832) * 0.5 + 0.5;
  float speed = (0.4 + rng * 0.6) * influence * mix(spread * 0.5, spread, oscillation);
  vec2  fly   = vec2(cos(angle), sin(angle)) / vec2(aspect, 1.0) * speed;

  vec2 sampleUV = mix(uv, cellUV + cellPx * 0.5 / u_resolution + fly, influence);

  out_color = texture(u_texture, clamp(sampleUV, 0.001, 0.999));
}
