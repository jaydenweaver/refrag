#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
in vec2 v_uv;
out vec4 out_color;

void main() {
  float tileSize = 12.0;
  vec2 tiles = u_resolution / tileSize;

  // Snap UV to the centre of the nearest tile
  vec2 tileUV = (floor(v_uv * tiles) + 0.5) / tiles;
  vec4 col = texture(u_texture, tileUV);

  // Subtle gap between tiles
  vec2 f = fract(v_uv * tiles);
  float border = 0.06;
  float inside = step(border, f.x) * step(border, f.y) *
                 step(f.x, 1.0 - border) * step(f.y, 1.0 - border);
  col.rgb *= mix(0.55, 1.0, inside);

  out_color = col;
}
