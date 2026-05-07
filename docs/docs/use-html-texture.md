---
id: use-html-texture
title: useHtmlTexture
sidebar_position: 3
---

# useHtmlTexture

`useHtmlTexture` is an escape-hatch hook for when you need to drive your own WebGL context, Three.js scene, or any other rendering pipeline with an HTML texture.

Use `<HtmlShader>` when you want a managed canvas + fragment shader. Use `useHtmlTexture` when you already have a WebGL context and just need the texture.

## Function signature

```ts
function useHtmlTexture(gl: WebGL2RenderingContext | null): UseHtmlTextureResult;
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `gl` | `WebGL2RenderingContext \| null` | The WebGL2 context to create and upload the texture into. Pass `null` during initial render or when the context is not yet available. |

## Return values

```ts
interface UseHtmlTextureResult {
  ref: RefCallback<HTMLElement>;
  texture: WebGLTexture | null;
  requestPaint: () => void;
  isSupported: boolean;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ref` | `RefCallback<HTMLElement>` | Attach to the HTML element whose content should be painted into the texture. The element must be a direct child of a canvas that has opted into the HTML-in-Canvas API. |
| `texture` | `WebGLTexture \| null` | The WebGL texture, or `null` until the first paint. The texture object identity is stable — only GPU content changes on repaint. |
| `requestPaint` | `() => void` | Imperatively trigger a repaint (equivalent to `canvas.requestPaint()`). |
| `isSupported` | `boolean` | `true` if the HTML-in-Canvas API is available in the current browser. |

## Full example

```tsx
import { useRef, useEffect } from "react";
import { useHtmlTexture } from "refrag";

function MyWebGLScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);

  // Initialise gl once
  useEffect(() => {
    const canvas = canvasRef.current!;
    glRef.current = canvas.getContext("webgl2");
  }, []);

  const { ref: htmlRef, texture, isSupported } = useHtmlTexture(glRef.current);

  useEffect(() => {
    if (!texture || !glRef.current) return;
    const gl = glRef.current;

    // Bind the texture and render your scene
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // ... draw calls ...
  }, [texture]);

  return (
    <>
      {/* Your custom WebGL canvas */}
      <canvas ref={canvasRef} width={800} height={600} />

      {/* Attach ref to the element you want as a texture source */}
      {isSupported && (
        <div ref={htmlRef} style={{ position: "absolute", visibility: "hidden" }}>
          <h1>This DOM node becomes a GPU texture</h1>
          <p>Style it however you like.</p>
        </div>
      )}
    </>
  );
}
```

## Notes

- **Texture identity is stable.** The `WebGLTexture` object returned never changes — only the GPU pixels are updated on repaint. Safe to use as a dependency in `useEffect` and `useMemo`.
- **Multiple instances.** The hook uses a `WeakMap`-based registry so multiple `useHtmlTexture` instances on the same page do not clobber each other's `onpaint` handler.
- **Strict Mode safe.** Cleanup fully removes the element from the canvas, deletes the texture, and nulls internal refs on unmount.
- **Fallback.** When `isSupported` is `false`, `texture` will remain `null` and `requestPaint` is a no-op. Guard your rendering code accordingly.
