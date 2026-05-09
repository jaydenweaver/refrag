import crtFrag        from "./shaders/crt.frag?raw";
import ditherFrag     from "./shaders/dither.frag?raw";
import liquidwarpFrag from "./shaders/liquidwarp.frag?raw";
import mouseFrag      from "./shaders/mouse.frag?raw";
import particlesFrag  from "./shaders/particles.frag?raw";
import shockwaveFrag  from "./shaders/shockwave.frag?raw";
import type { ShaderEntry } from "./types";

export const PASSTHROUGH_FRAG = `#version 300 es
precision mediump float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 out_color;
void main() { out_color = texture(u_texture, v_uv); }
`;

export const INITIAL_SHADERS: ShaderEntry[] = [
  { key: "crt",        label: "CRT",       frag: crtFrag },
  { key: "dither",     label: "dither",    frag: ditherFrag },
  { key: "liquidwarp", label: "liquid",    frag: liquidwarpFrag },
  { key: "mouse",      label: "mouse",     frag: mouseFrag },
  { key: "particles",  label: "particles", frag: particlesFrag },
  { key: "shockwave",  label: "shockwave", frag: shockwaveFrag },
];
