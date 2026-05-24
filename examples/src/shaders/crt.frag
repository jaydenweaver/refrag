#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

in vec2 v_uv;
out vec4 out_color;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Barrel distortion — subtle screen curvature
vec2 curve(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 bend = abs(uv.yx) / vec2(5.5, 4.0);
  uv += uv * bend * bend;
  return uv * 0.5 + 0.5;
}

void main() {
  float curvature    = 0.0008; // 0–0.005 — chromatic aberration at edges
  float scanStrength = 0.12;   // 0–1 — scanline contrast
  float grainAmount  = 0.025;  // 0–0.1 — film grain intensity
  float vigStrength  = 0.55;   // 0–1 — vignette falloff

  vec2 uv = curve(v_uv);

  // Black mask outside the curved screen
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    out_color = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Sample with subtle chromatic abberation along the edges
  float ca = curvature * length(uv * 2.0 - 1.0);
  vec2 dir = normalize(uv - 0.5);
  float r = texture(u_texture, uv + dir * ca).r;
  float g = texture(u_texture, uv).g;
  float b = texture(u_texture, uv - dir * ca).b;
  float a = texture(u_texture, uv).a;
  vec4 col = vec4(r, g, b, a);

  // Scanlines — one dark band per physical pixel row pair
  float scan = sin(uv.y * u_resolution.y * 3.14159);
  col.rgb *= (1.0 - scanStrength) + scanStrength * scan;

  // Subtle phosphor row tint (R/G/B sub-pixels)
  float px = mod(gl_FragCoord.x, 3.0);
  vec3 phosphor = vec3(
    step(px, 1.0),
    step(1.0, px) * step(px, 2.0),
    step(2.0, px)
  );
  col.rgb *= 0.97 + 0.03 * phosphor;

  // Vignette
  vec2 vig = v_uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vig * vigStrength, vig * vigStrength);
  col.rgb *= smoothstep(0.0, 1.0, vignette);

  // Film grain
  float grain = hash(v_uv + fract(u_time * 0.07));
  col.rgb += (grain - 0.5) * grainAmount;

  out_color = col;
}
