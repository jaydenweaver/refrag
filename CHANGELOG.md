# Changelog

## [Unreleased]

### Added
- `isApiSupported()` is now exported from `refrag`. Probes for `texElementImage2D` on a temporary WebGL2 context (released immediately so it does not count against the browser limit) and caches the result. Use it to detect fallback state and conditionally render UI.
- Fallback wrapper now mirrors the `style`, `className`, `width`, and `height` props of `HtmlShader`, so layout is preserved (e.g. `position: fixed`) in unsupported browsers.

## [0.2.0]

### Added
- `frag` now accepts `string | string[]`. Pass an array to chain multiple fragment shaders in order — each pass receives the previous pass's output as `u_texture`. All automatic uniforms (`u_time`, `u_mouse`, `u_resolution`, etc.) and custom uniforms are available in every pass.
- Ping-pong FBOs for intermediate passes. Intermediate passes render into alternating off-screen framebuffers (no allocation per frame); only the final pass writes to the screen.
- Each shader in a multi-pass chain is compiled with two vertex variants: one without Y-flip for intermediate FBO passes and one with Y-flip for the final screen pass, preventing the double-inversion that would otherwise occur.
- `HtmlShader` now composites child `<canvas>` elements correctly. Previously they appeared black because `texElementImage2D` cannot capture GPU-layer canvas content. Child canvases are now detected via `MutationObserver`, uploaded each frame via `texImage2D`, and blended into the HTML texture in a compositor pre-pass (FBO) before the user shader runs. Up to 8 child canvases are supported simultaneously.

## [0.1.0]

### Added
- `HtmlShader` now renders children directly (no canvas, no shader) when the HTML-in-Canvas API is unavailable, so content remains visible in unsupported browsers.
- Documentation site scaffolded under `docs/` (Docusaurus v3) covering Getting Started, HtmlShader, useHtmlTexture, and Browser Support. Known limitations for `overflow: scroll` and other compositing restrictions are documented with workarounds.
- GitHub Actions CI: lint, typecheck, and unit + e2e tests run on every PR; package version is auto-bumped and published to npm on merge to `main` via OIDC trusted publishing.

### Fixed
- `onpaint` now re-uploads the texture when a **descendant** of the content element repaints (e.g. a scrolling child, a hover state change). Previously only a repaint of the root content element itself was detected.
- Evicted paint records no longer cause a blank frame. When `texElementImage2D` throws because the browser has evicted the paint record (a composited scroll or transform sidesteps the paint cycle), the previous frame's texture is kept and `requestPaint()` is called to self-heal on the next cycle.
- Canvas dimensions are now read synchronously on mount via `getBoundingClientRect`, preventing a blank first frame when the canvas is sized via CSS (`width: 100%`, `height: 100vh`, etc.).
- Removed an ineffective in-canvas scroll listener. `overflow: scroll` inside canvas content is a spec-level limitation — `texElementImage2D` enforces `contain: paint` and cannot capture GPU-composited scroll layers. The listener implied the problem was handled when it was not.

## [0.0.5] - 2026-05-06

### Added
- `animated` prop on `HtmlShader` (default `true`). Set to `false` to skip the continuous rAF loop for static or on-demand shaders — the canvas only redraws when `onpaint` fires.

## [0.0.4]

- Initial public release.
