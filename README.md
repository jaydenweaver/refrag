# refrag

React library for the experimental [HTML-in-Canvas API](https://github.com/WICG/html-in-canvas).

Renders real, interactive, accessible HTML inside a `<canvas>` as a live WebGL texture. Plug in a GLSL fragment shader to apply effects. The DOM content is available as `u_texture`.

> **Status:** Early-stage / pre-v1. Requires a browser with the HTML-in-Canvas origin trial enabled (Chromium).

---

## What it does

The HTML-in-Canvas API lets browsers paint DOM subtrees into a WebGL texture. `refrag` exposes the low-level primitives (`layoutSubtree`, `texElementImage2D`, `onpaint`) through an idiomatic React component so you can write this:

```tsx
import frag from './ripple.frag?raw';

<HtmlCanvas frag={frag}>
  <div className="card">
    <h1>Real HTML</h1>
    <p>Real CSS. Real accessibility.</p>
  </div>
</HtmlCanvas>
```

And get real DOM (focusable, selectable, screen-reader accessible) rendered through a WebGL shader.

---

## Requirements

- React 19 or later
- A browser with the HTML-in-Canvas API (`texElementImage2D`, `onpaint`, `layoutSubtree`). Currently Chromium with the origin trial or an experimental build.

---

## Installation

```bash
npm install refrag
```

---

## Usage

### Basic (no shader)

Without a shader the canvas renders the HTML content as-is:

```tsx
import { HtmlCanvas } from 'refrag';

<HtmlCanvas style={{ width: 640, height: 420 }}>
  <div style={{ padding: '2rem', background: '#1e293b', color: '#f8fafc' }}>
    Hello from the DOM
  </div>
</HtmlCanvas>
```

### With a fragment shader

Import your `.glsl` file as a raw string (Vite `?raw`, webpack `raw-loader`, etc.) and pass it as `frag`:

```tsx
import { HtmlCanvas } from 'refrag';
import frag from './wave.frag?raw';

<HtmlCanvas frag={frag} style={{ width: 640, height: 420 }}>
  <div className="card">...</div>
</HtmlCanvas>
```

### Responsive sizing

Size the canvas with CSS. The pixel buffer tracks the rendered size automatically via `ResizeObserver`:

```tsx
<HtmlCanvas frag={frag} style={{ width: '100%', height: '50vh' }}>
  ...
</HtmlCanvas>
```

---

## Uniforms

The following uniforms are wired up automatically and available in every fragment shader:

| Uniform | Type | Description |
|---|---|---|
| `u_texture` | `sampler2D` | The HTML content as a GPU texture |
| `u_resolution` | `vec2` | Canvas buffer size in device pixels |
| `u_time` | `float` | Seconds since mount |
| `u_mouse` | `vec2` | Pointer position, normalized 0-1 |
| `u_mouse_down` | `float` | `1.0` while a pointer button is held, `0.0` otherwise |
| `u_mouse_inside` | `float` | `1.0` while the pointer is over the canvas, `0.0` otherwise |
| `u_dpr` | `float` | `devicePixelRatio` |

Example shader using `u_mouse_inside` to gate an effect:

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_mouse_inside;

in vec2 v_uv;
out vec4 out_color;

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 toMouse = (uv - u_mouse) * vec2(aspect, 1.0);
  float dist = length(toMouse);
  float bulge = (1.0 - smoothstep(0.0, 0.25, dist)) * 0.3 * u_mouse_inside;
  uv -= (toMouse / vec2(aspect, 1.0)) * bulge;
  out_color = texture(u_texture, uv);
}
```

---

## Props

### `HtmlCanvasProps`

| Prop | Type | Description |
|---|---|---|
| `frag` | `string` | Raw GLSL fragment shader source. Defaults to a passthrough. |
| `vert` | `string` | Raw GLSL vertex shader source. Defaults to a full-screen triangle. |
| `width` | `number \| string` | CSS width (e.g. `640`, `"100%"`). |
| `height` | `number \| string` | CSS height (e.g. `420`, `"50vh"`). |
| `className` | `string` | Class name applied to the `<canvas>` element. |
| `style` | `CSSProperties` | Inline style applied to the `<canvas>` element. |
| `children` | `ReactNode` | HTML content rendered as the WebGL texture. |

### Imperative handle (`ref`)

```tsx
const ref = useRef<HtmlCanvasHandle>(null);

<HtmlCanvas ref={ref} frag={frag}>
  ...
</HtmlCanvas>
```

| Property | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement \| null` | The underlying canvas element. |
| `gl` | `WebGL2RenderingContext \| null` | The WebGL2 rendering context. |
| `requestPaint()` | `() => void` | Manually trigger a re-paint of the HTML content. |

---

## How it works

1. `<HtmlCanvas>` renders a `<canvas>` element and portals its children into the canvas as a direct DOM child (required by the spec).
2. The canvas opts into the HTML-in-Canvas API via `layoutSubtree = true`.
3. An `onpaint` handler uploads the HTML content to a WebGL texture via `texElementImage2D` whenever the browser repaints it.
4. A `requestAnimationFrame` loop runs the shader every frame, sampling `u_texture` and writing to the canvas.
5. A `ResizeObserver` keeps the pixel buffer in sync with the canvas CSS layout size, multiplied by `devicePixelRatio`.

---

## Goals

- **Idiomatic React.** Declarative, composable, TypeScript-first, React 19 compatible, Next.js `"use client"` safe.
- **Zero boilerplate.** Sane defaults, automatic uniform wiring, no WebGL setup required.
- **HiDPI correct.** Pixel buffer always matches `devicePixelRatio`.
- **Accessible.** Real DOM is preserved so screen readers, focus, and tab order work as normal.
- **Tree-shakable.** Zero runtime dependencies beyond React.
- **Escape hatches.** Imperative `ref`, raw `gl` access, custom vertex shaders.

---

## Development

```bash
npm run dev        # start examples playground
npm run build      # build library (ESM + CJS + types)
npm run test       # Vitest unit tests
npm run lint       # ESLint
```

---

## License

MIT
