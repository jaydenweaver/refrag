# refrag

React library for the experimental [HTML-in-Canvas API](https://github.com/WICG/html-in-canvas).

Renders real, interactive, accessible HTML inside a `<canvas>` as a live WebGL texture. Plug in a GLSL fragment shader to apply effects. The DOM content is available as `u_texture`.

> **Status:** Early-stage / pre-v1. Requires a browser with the HTML-in-Canvas origin trial enabled (Chromium).

---

## What it does

The HTML-in-Canvas API lets browsers paint DOM subtrees into a WebGL texture. `refrag` exposes the low-level primitives (`layoutSubtree`, `texElementImage2D`, `onpaint`) through an idiomatic React component so you can write this:

```tsx
import frag from './ripple.frag?raw';

<HtmlShader frag={frag}>
  <div className="card">
    <h1>Real HTML</h1>
    <p>Real CSS. Real accessibility.</p>
  </div>
</HtmlShader>
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
import { HtmlShader } from 'refrag';

<HtmlShader style={{ width: 640, height: 420 }}>
  <div style={{ padding: '2rem', background: '#1e293b', color: '#f8fafc' }}>
    Hello from the DOM
  </div>
</HtmlShader>
```

### With a fragment shader

Import your `.glsl` file as a raw string (Vite `?raw`, webpack `raw-loader`, etc.) and pass it as `frag`:

```tsx
import { HtmlShader } from 'refrag';
import frag from './wave.frag?raw';

<HtmlShader frag={frag} style={{ width: 640, height: 420 }}>
  <div className="card">...</div>
</HtmlShader>
```

### Responsive sizing

Size the canvas with CSS. The pixel buffer tracks the rendered size automatically via `ResizeObserver`:

```tsx
<HtmlShader frag={frag} style={{ width: '100%', height: '50vh' }}>
  ...
</HtmlShader>
```

### Custom uniforms

Pass your own uniforms as an array — changes are picked up each frame with no re-mount. Booleans map to `float` `1.0`/`0.0`:

```tsx
<HtmlShader
  frag={frag}
  uniforms={[
    { name: 'u_active', value: isActive },       // boolean → float
    { name: 'u_strength', value: 0.8 },          // float
    { name: 'u_color', value: [1, 0.5, 0.2] },  // vec3
  ]}
>
  <div className="card">...</div>
</HtmlShader>
```

In your shader:

```glsl
uniform float u_active;
uniform float u_strength;
uniform vec3 u_color;
```

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

---

## Props

### `HtmlShaderProps`

| Prop | Type | Description |
|---|---|---|
| `frag` | `string` | Raw GLSL fragment shader source. Defaults to a passthrough. |
| `vert` | `string` | Raw GLSL vertex shader source. Defaults to a full-screen triangle. |
| `width` | `number \| string` | CSS width (e.g. `640`, `"100%"`). |
| `height` | `number \| string` | CSS height (e.g. `420`, `"50vh"`). |
| `uniforms` | `CustomUniform[]` | Custom uniforms uploaded each frame. See [Custom uniforms](#custom-uniforms). |
| `className` | `string` | Class name applied to the `<canvas>` element. |
| `style` | `CSSProperties` | Inline style applied to the `<canvas>` element. |
| `children` | `ReactNode` | HTML content rendered as the WebGL texture. |

### `CustomUniform`

| `value` type | GLSL type |
|---|---|
| `boolean` | `float` (`0.0` or `1.0`) |
| `number` | `float` |
| `[number, number]` | `vec2` |
| `[number, number, number]` | `vec3` |
| `[number, number, number, number]` | `vec4` |

### Imperative handle (`ref`)

```tsx
const ref = useRef<HtmlShaderHandle>(null);

<HtmlShader ref={ref} frag={frag}>
  ...
</HtmlShader>
```

| Property | Type | Description |
|---|---|---|
| `canvas` | `HTMLCanvasElement \| null` | The underlying canvas element. |
| `gl` | `WebGL2RenderingContext \| null` | The WebGL2 rendering context. |
| `requestPaint()` | `() => void` | Manually trigger a re-paint of the HTML content. |

---

## How it works

1. `<HtmlShader>` renders a `<canvas>` element and portals its children into the canvas as a direct DOM child (required by the spec).
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
