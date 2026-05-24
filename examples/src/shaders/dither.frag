#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_mouse_inside;
uniform float u_mouse_down;

in vec2 v_uv;
out vec4 out_color;

// 4×4 Bayer ordered dither threshold, range [0, 1)
float bayer(ivec2 p) {
  int x = p.x & 3, y = p.y & 3;
  float m[16] = float[16](
     0.0,  8.0,  2.0, 10.0,
    12.0,  4.0, 14.0,  6.0,
     3.0, 11.0,  1.0,  9.0,
    15.0,  7.0, 13.0,  5.0
  );
  return m[y * 4 + x] / 16.0;
}

void main() {
  float levelsNormal = 8.0; // colour levels when pointer is away
  float levelsActive = 2.0; // colour levels when pointer is over / clicking

  vec4 c = texture(u_texture, v_uv);
  float t = bayer(ivec2(v_uv * u_resolution));

  // Fewer levels when mouse is over the canvas for a more dramatic effect
  float levels = mix(levelsNormal, levelsActive, u_mouse_inside * 0.5 + u_mouse_down * 0.5);

  vec3 dithered = floor(c.rgb * levels + t) / levels;
  out_color = vec4(dithered, c.a);
}
