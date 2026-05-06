# refrag

Zero deps, tree-shakeable React library for the experimental [HTML-in-Canvas API](https://github.com/WICG/html-in-canvas).

---

## What it does

`refrag` abstracts the HTML-in-Canvas API and WebGL boilerplate into a single React component, `HtmlShader`. Pass your HTML as children and a GLSL fragment shader as a prop.

```tsx
import { HtmlShader } from 'refrag'
import frag from './ripple.frag?raw';

<HtmlShader frag={frag} width={640} height={420}>
  <div className="card">
    <h1>Hello DOM</h1>
  </div>
</HtmlShader>
```

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

## refrag vs Three.js HTMLTexture

Three.js [added `HTMLTexture`](https://github.com/mrdoob/three.js/pull/31233) which uses the same underlying API. If you're already in a Three.js / React Three Fiber scene and just need HTML on a mesh, use that. It's the right tool for the job.

**Use `refrag` when:**

- You're building a React app and want to apply shader effects to HTML UI (cards, text, dashboards) with no 3D scene involved.
- You want a declarative, props-driven API with automatic uniform wiring, resize handling, and React 19 integration.
- You need the escape hatches (`useHtmlTexture`, raw `gl` access) without pulling in a full 3D engine.

**Use Three.js / R3F when:**

- You have an existing 3D scene and want HTML content on a mesh or billboard in 3D space.
- You need perspective, lighting, or other 3D transforms on the HTML surface.
- You're already using `@react-three/fiber` and want to stay in that ecosystem.

The two are not mutually exclusive. `useHtmlTexture` exposes the raw `WebGLTexture` so it can be handed off to any renderer, including Three.js.

---

## Goals

- **Idiomatic React.** Declarative, composable, TypeScript-first, React 19 compatible, Next.js `"use client"` safe.
- **Zero boilerplate.** Sane defaults, automatic uniform wiring, no WebGL setup required.
- **HiDPI correct.** Pixel buffer always matches `devicePixelRatio`.
- **Accessible.** Real DOM is preserved so screen readers, focus, and tab order work as normal.
- **Tree-shakeable.** Zero runtime dependencies beyond React.
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

## Acknowledgements

Thanks to the [WICG HTML-in-Canvas](https://github.com/WICG/html-in-canvas) team for designing and driving this API. Without their work none of this would be possible. Thanks also to the Three.js contributors behind [`HTMLTexture`](https://github.com/mrdoob/three.js/pull/31233), whose implementation was a valuable reference during the development of `useHtmlTexture`.

---

## License

MIT
