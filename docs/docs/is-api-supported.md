---
id: is-api-supported
title: isApiSupported
sidebar_position: 4
---

# isApiSupported

A utility function that detects whether the HTML-in-Canvas API is available in the current browser.

## Signature

```ts
function isApiSupported(): boolean
```

Returns `true` if the API is available, `false` otherwise.

## Usage

```tsx
import { isApiSupported } from "refrag";

if (!isApiSupported()) {
  console.warn("HTML-in-Canvas API unavailable — shaders will not be applied.");
}
```

Conditionally render a warning or fallback UI:

```tsx
import { isApiSupported } from "refrag";

function ApiWarning() {
  if (isApiSupported()) return null;
  return (
    <p style={{ color: "red" }}>
      Shaders are disabled — enable the HTML-in-Canvas flag in your browser.
    </p>
  );
}
```

## Notes

- **Cached.** The result is computed once and reused on subsequent calls. A temporary WebGL2 context is created to probe for `texElementImage2D`, then immediately released via `WEBGL_lose_context` so it does not count against the browser's context limit.
- **SSR safe.** Returns `true` on the server (where `document` is undefined) to defer the check to the client.
- **Consistent with `HtmlShader`.** This is the same check `HtmlShader` uses internally to decide whether to render a canvas or fall back to plain DOM.

## When to use

Prefer letting `HtmlShader` handle the fallback automatically — it renders children directly on unsupported browsers with no extra code. Use `isApiSupported` explicitly when you need to:

- Conditionally render a warning or badge
- Skip expensive setup (loading shaders, allocating textures) on unsupported browsers
- Drive application-level state based on API availability
