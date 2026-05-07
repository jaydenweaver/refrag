# Changelog

## [0.0.6]

### Added
- `HtmlShader` now renders children directly (no canvas, no shader) when the HTML-in-Canvas API is unavailable, so content remains visible in unsupported browsers.
- Documentation site scaffolded under `docs/` (Docusaurus v3) covering Getting Started, HtmlShader, useHtmlTexture, and Browser Support.

### Fixed
- `onpaint` now re-uploads the texture when a **descendant** of the content element repaints (e.g. a scrolling child, a hover state change). Previously only a repaint of the root content element itself was detected.
- Evicted paint records no longer cause a blank frame. When `texElementImage2D` throws because the browser has evicted the paint record (a composited scroll or transform sidesteps the paint cycle), the previous frame's texture is kept and `requestPaint()` is called to self-heal on the next cycle.

## [0.0.5] - 2026-05-06

### Added
- `animated` prop on `HtmlShader` (default `true`). Set to `false` to skip the continuous rAF loop for static or on-demand shaders — the canvas only redraws when `onpaint` fires.

## [0.0.4]

- Initial public release.
