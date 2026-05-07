---
id: html-shader
title: HtmlShader
sidebar_position: 2
---

# HtmlShader

`HtmlShader` is the primary component in refrag. It mounts a `<canvas>`, renders your React children as a live DOM subtree inside it via the HTML-in-Canvas API, and exposes that subtree as a WebGL texture that your fragment shader can sample.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `frag` | `string` | passthrough | GLSL fragment shader source. |
| `vert` | `string` | passthrough | GLSL vertex shader source. |
| `width` | `number` | `300` | Canvas width in CSS pixels. |
| `height` | `number` | `300` | Canvas height in CSS pixels. |
| `animated` | `boolean` | `true` | Run a continuous `requestAnimationFrame` loop. Set `false` for static content. |
| `uniforms` | `CustomUniform[]` | `[]` | Extra uniforms to pass to the shader. See [CustomUniform](#customuniform). |
| `className` | `string` | — | CSS class applied to the `<canvas>` element. |
| `style` | `CSSProperties` | — | Inline styles applied to the `<canvas>` element. |
| `children` | `ReactNode` | — | HTML content to render inside the canvas. |

## Automatic uniforms

These uniforms are wired automatically — declare them in your shader and they just work.

| Uniform | GLSL type | Description |
|---------|-----------|-------------|
| `u_texture` | `sampler2D` | The HTML children painted as a texture. |
| `u_resolution` | `vec2` | Canvas size in physical pixels (`width * dpr`, `height * dpr`). |
| `u_time` | `float` | Elapsed time in seconds since mount. |
| `u_mouse` | `vec2` | Mouse position in physical pixels, origin bottom-left. |
| `u_mouse_down` | `float` | `1.0` while any mouse button is held, else `0.0`. |
| `u_mouse_inside` | `float` | `1.0` while the pointer is over the canvas, else `0.0`. |
| `u_dpr` | `float` | Device pixel ratio (`window.devicePixelRatio`). |

## CustomUniform

Pass additional uniforms via the `uniforms` prop. Each entry is a `CustomUniform` object:

```ts
type CustomUniform =
  | { name: string; value: number }           // float
  | { name: string; value: [number, number] } // vec2
  | { name: string; value: [number, number, number] } // vec3
  | { name: string; value: [number, number, number, number] } // vec4
  | { name: string; value: number[] }         // float array / mat
```

| `value` type | GLSL type |
|--------------|-----------|
| `number` | `float` |
| `[x, y]` | `vec2` |
| `[x, y, z]` | `vec3` |
| `[x, y, z, w]` | `vec4` |

```tsx
<HtmlShader
  frag={myFrag}
  uniforms={[
    { name: "u_brightness", value: 0.8 },
    { name: "u_tint", value: [1.0, 0.5, 0.2] },
  ]}
>
  <MyUI />
</HtmlShader>
```

## Ref / HtmlShaderHandle

Attach a ref to access the underlying WebGL context and canvas imperatively.

```ts
interface HtmlShaderHandle {
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  requestPaint: () => void;
}
```

```tsx
const shaderRef = useRef<HtmlShaderHandle>(null);

// Force a repaint outside of React's render cycle
shaderRef.current?.requestPaint();

<HtmlShader ref={shaderRef} frag={myFrag}>
  <MyUI />
</HtmlShader>
```

## Fallback behaviour

If the browser does not support the HTML-in-Canvas API, `HtmlShader` renders its `children` directly without a canvas. This means your UI remains visible and functional in unsupported environments — the shader effect is simply absent.

```tsx
// Works in all browsers — shows plain DOM on unsupported ones
<HtmlShader frag={glowFrag} width={500} height={400}>
  <article>
    <h1>Still readable without WebGL magic</h1>
  </article>
</HtmlShader>
```

## Full example — ripple shader

```tsx
import { HtmlShader } from "refrag";

const rippleFrag = `
  precision mediump float;
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    vec2 mouse = u_mouse / u_resolution;
    float dist = distance(uv, mouse);
    float wave = sin(dist * 40.0 - u_time * 6.0) * 0.005;
    vec2 offset = normalize(uv - mouse) * wave;
    gl_FragColor = texture2D(u_texture, uv + offset);
  }
`;

export default function Ripple() {
  return (
    <HtmlShader frag={rippleFrag} width={600} height={400}>
      <div style={{ padding: 32, background: "white", fontFamily: "sans-serif" }}>
        <h1>Move your mouse over me</h1>
        <p>The DOM content ripples in response to the cursor.</p>
      </div>
    </HtmlShader>
  );
}
```
