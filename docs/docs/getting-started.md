---
id: getting-started
title: Getting Started
sidebar_position: 1
slug: /
---

# Getting Started

refrag is a React library that brings real HTML, CSS, and accessible DOM elements inside a `<canvas>` using the experimental [HTML-in-Canvas API](https://github.com/WICG/html-in-canvas). Your component tree becomes a live WebGL texture — styled, interactive, and screen-reader-accessible — ready to use in 2D, WebGL, or WebGPU rendering contexts.

## Installation

```bash
npm install refrag
```

## Prerequisites

- **React 19+**
- A browser with the HTML-in-Canvas API enabled (see [Browser Support](/browser-support))

## Quick start

The primary export is `<HtmlShader>`. Pass your GLSL fragment shader and any React children. The children are painted into a WebGL texture and the shader can sample it via `u_texture`.

```tsx
import { HtmlShader } from "refrag";

export default function App() {
  return (
    <HtmlShader
      frag={`
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        varying vec2 v_uv;

        void main() {
          gl_FragColor = texture2D(u_texture, v_uv);
        }
      `}
      width={400}
      height={300}
    >
      <div style={{ padding: 24, fontFamily: "sans-serif" }}>
        <h1>Hello from the DOM</h1>
        <p>This text lives inside a WebGL canvas.</p>
      </div>
    </HtmlShader>
  );
}
```

> **No shader needed?** Omit `frag` and `vert` entirely — refrag ships passthrough shaders that just blit the HTML texture to the canvas.

## Importing `.glsl` files

For larger shaders, keep GLSL in separate files and import them as raw strings.

**Vite**

```ts
// vite-env.d.ts (add once)
declare module "*.glsl?raw" {
  const src: string;
  export default src;
}
```

```tsx
import ripple from "./ripple.glsl?raw";

<HtmlShader frag={ripple} width={400} height={300}>
  <MyUI />
</HtmlShader>
```

**Next.js** — install `next-plugin-glsl` or use `raw-loader` and configure `next.config.js` to handle `.glsl` imports.

## Next steps

- Full props, uniforms, and ref API → [HtmlShader](/html-shader)
- Custom WebGL / Three.js setups → [useHtmlTexture](/use-html-texture)
- Origin trial and flags → [Browser Support](/browser-support)
