#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
in vec2 v_uv;
out vec4 out_color;

void main() {
  float tileSize  = 12.0; // px — pixel block size
  float gapFactor = 0.06; // 0–0.5 — relative gap width between tiles
  float gapDark   = 0.55; // 0–1 — brightness of the gap

  vec2 tiles = u_resolution / tileSize;

  // Snap UV to the centre of the nearest tile
  vec2 tileUV = (floor(v_uv * tiles) + 0.5) / tiles;
  vec4 col = texture(u_texture, tileUV);

  // Subtle gap between tiles
  vec2 f = fract(v_uv * tiles);
  float inside = step(gapFactor, f.x) * step(gapFactor, f.y) *
                 step(f.x, 1.0 - gapFactor) * step(f.y, 1.0 - gapFactor);
  col.rgb *= mix(gapDark, 1.0, inside);

  out_color = col;
}
