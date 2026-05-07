---
id: browser-support
title: Browser Support
sidebar_position: 4
---

# Browser Support

The HTML-in-Canvas API is an experimental WICG proposal currently implemented behind a flag in Chromium. It is **not yet available** in stable Chrome, Firefox, or Safari.

## Current status

| Browser | Status |
|---------|--------|
| Chrome (flag) | Available — see below |
| Chrome (stable) | Origin trial only |
| Edge | Same as Chrome (Chromium-based) |
| Firefox | Not implemented |
| Safari | Not implemented |

Follow the proposal at [github.com/WICG/html-in-canvas](https://github.com/WICG/html-in-canvas).

## Enabling in Chrome for development

1. Open `chrome://flags` in your address bar.
2. Search for **Canvas Draw Element**.
3. Set it to **Enabled**.
4. Relaunch Chrome.

```
chrome://flags/#canvas-draw-element
```

This makes the API available for local development and testing. Do not ship to production users this way — use the origin trial instead.

## Origin trial for production

If you want to use refrag on a live site before the API reaches stable Chrome, register for the [origin trial](https://developer.chrome.com/origintrials/) for "HTML in Canvas".

1. Go to the Chrome Origin Trials dashboard.
2. Find **HTML in Canvas** and register your origin.
3. Add the token to your HTML `<head>`:

```html
<meta http-equiv="origin-trial" content="YOUR_TOKEN_HERE" />
```

Or set it as an HTTP response header:

```
Origin-Trial: YOUR_TOKEN_HERE
```

Origin trial tokens are domain-scoped and time-limited. Renew before expiry.

## Fallback behaviour

refrag is designed to degrade gracefully when the API is unavailable.

**`<HtmlShader>`** — renders `children` directly as plain DOM, without a canvas or shader. Your content is still visible, interactive, and accessible. The canvas and WebGL context are never created.

```tsx
// On unsupported browsers this renders a normal <div> with your content inside
<HtmlShader frag={glowFrag} width={500} height={400}>
  <article>
    <h1>Works everywhere</h1>
    <p>The glow effect is a progressive enhancement.</p>
  </article>
</HtmlShader>
```

**`useHtmlTexture`** — returns `isSupported: false` and `texture: null`. The `ref` callback is a no-op. Check `isSupported` before setting up your WebGL scene.

```tsx
const { ref, texture, isSupported } = useHtmlTexture(gl);

if (!isSupported) {
  // Render a fallback or skip WebGL setup
}
```

## Feature detection

You can detect support manually if needed:

```ts
const isSupported =
  "layoutSubtree" in HTMLCanvasElement.prototype;
```
