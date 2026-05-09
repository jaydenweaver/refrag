import crtFrag        from "./shaders/crt.frag?raw";
import ditherFrag     from "./shaders/dither.frag?raw";
import liquidwarpFrag from "./shaders/liquidwarp.frag?raw";
import pixelateFrag   from "./shaders/pixelate.frag?raw";
import magnifyFrag    from "./shaders/magnify.frag?raw";
import disintegrateFrag from "./shaders/disintegrate.frag?raw";
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
  { key: "pixelate",   label: "pixelate",  frag: pixelateFrag },
  { key: "magnify",    label: "magnify",   frag: magnifyFrag },
  { key: "disintegrate", label: "disintegrate", frag: disintegrateFrag },
  { key: "shockwave",  label: "shockwave", frag: shockwaveFrag },
];
