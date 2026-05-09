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
| `frag` | `string \| string[]` | passthrough | GLSL fragment shader source, or an array for multi-pass rendering. |
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

## Multi-pass rendering

Pass an array of fragment shader strings to `frag` to chain multiple passes. Each shader receives the previous pass's output as `u_texture`. All automatic uniforms and custom uniforms are available in every pass.

```tsx
import { HtmlShader } from "refrag";
import blur from "./blur.frag?raw";
import grain from "./grain.frag?raw";

<HtmlShader frag={[blur, grain]} width={640} height={480}>
  <MyUI />
</HtmlShader>
```

Passes are applied in array order: `blur` samples the HTML texture, then `grain` samples blur's output.

**Implementation details:**
- Intermediate passes render into ping-pong FBOs (no per-frame allocation).
- Each shader is compiled twice: once without Y-flip for FBO targets and once with Y-flip for the final screen pass, preventing double-inversion in the chain.
- Switching between a single shader and an array does not remount the component.

## Child canvas elements

Child `<canvas>` elements inside your `HtmlShader` content are composited automatically. The HTML-in-Canvas API (`texElementImage2D`) cannot capture GPU-layer canvas content, so those elements normally appear black. `HtmlShader` works around this transparently:

1. A `MutationObserver` watches the content subtree for `<canvas>` additions and removals.
2. Each frame, child canvas pixel data is uploaded to its own `WebGLTexture` via `texImage2D`.
3. A compositor pre-pass (FBO) blends the child textures into the HTML texture at their correct positions before your shader runs.

```tsx
<HtmlShader frag={frag} width={640} height={480}>
  <div>
    <canvas ref={myCanvasRef} width={320} height={240} />
    <p>Caption text</p>
  </div>
</HtmlShader>
```

**Limits and performance notes:**
- Up to 8 child canvases are composited per frame.
- Each child canvas incurs a full `texImage2D` upload every frame regardless of whether it changed.
- `getBoundingClientRect` is called once per child canvas per frame for UV positioning.
- If your child canvas is static or low-frequency, prefer `animated={false}` to avoid unnecessary uploads.

## Fallback behaviour

If the browser does not support the HTML-in-Canvas API, `HtmlShader` renders its `children` directly without a canvas, preserving `style`, `className`, `width`, and `height` on a wrapper `<div>`. Your UI remains visible and functional — the shader effect is simply absent.

```tsx
// Works in all browsers — shows plain DOM on unsupported ones
<HtmlShader frag={glowFrag} width={500} height={400}>
  <article>
    <h1>Still readable without WebGL magic</h1>
  </article>
</HtmlShader>
```

Use `isApiSupported` to detect the fallback state and conditionally render UI:

```tsx
import { isApiSupported } from "refrag";

function Banner() {
  if (!isApiSupported()) {
    return <p style={{ color: "red" }}>Shaders unavailable — enable the HTML-in-Canvas flag.</p>;
  }
  return null;
}
```

## Known limitations

### `overflow: scroll` inside canvas content

The HTML-in-Canvas spec enforces `contain: paint` on every element passed to `texElementImage2D`. Per the spec: *"Overflowing content (both layout and ink overflow) is clipped to the element's border box."* Additionally, Chrome promotes `overflow: scroll` containers with overflowing content to GPU compositing layers, which `texElementImage2D` captures from CPU paint operations only — leaving the scroll container blank.

**Workaround:** drive scrolling from a native page scroll instead of an in-canvas scroll container. Use `position: fixed` on the canvas, let the page body scroll normally, then offset the inner content with `marginTop: -window.scrollY` and call `requestPaint()` on each scroll event.

```tsx
export function App() {
  const shaderRef = useRef<HtmlShaderHandle>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);

  // Size the spacer so the page has native scroll distance.
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (spacerRef.current && innerRef.current) {
        const scrollable = innerRef.current.scrollHeight - window.innerHeight;
        spacerRef.current.style.height = `${Math.max(0, scrollable)}px`;
      }
    });
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, []);

  // Follow native page scroll without overflow:scroll.
  useEffect(() => {
    const onScroll = () => {
      if (innerRef.current)
        innerRef.current.style.marginTop = `-${window.scrollY}px`;
      shaderRef.current?.requestPaint();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Makes the page scrollable — real scrollbar, keyboard, momentum. */}
      <div ref={spacerRef} aria-hidden style={{ pointerEvents: "none" }} />
      <HtmlShader
        ref={shaderRef}
        frag={myFrag}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%" }}
      >
        <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
          <div ref={innerRef}>
            {/* your content */}
          </div>
        </div>
      </HtmlShader>
    </>
  );
}
```

This gives users a real browser scrollbar, keyboard shortcuts (arrows, space, Page Down), and trackpad/touch momentum — identical to native scroll behavior.

### Other spec-level restrictions

The same `contain: paint` rule applies to anything that creates a composited sublayer or overflows the border box. Per the WICG spec and current Chromium implementation:

| Feature | Behaviour |
|---------|-----------|
| Child `<canvas>` elements | Composited automatically via FBO pre-pass — renders correctly |
| CSS `transform` on canvas children | **Ignored for drawing** (does not affect texture output) |
| `backdrop-filter` | Not applied (open Chromium bug) |
| `mix-blend-mode` | Applied incorrectly / twice (open Chromium bug) |
| `will-change: transform` | Composited layer dropped from texture |
| Cross-origin embedded content | Silently omitted (privacy requirement) |
| `overflow: scroll` / `overflow: auto` | Blank — composited scroll layer not captured |

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
