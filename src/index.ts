// Primary API
export { HtmlCanvas } from "./components/index.js";
export type { HtmlCanvasHandle, HtmlCanvasProps } from "./components/index.js";

// Escape-hatch hook for users with an existing WebGL context
export { useHtmlTexture } from "./hooks/index.js";
export type { UseHtmlTextureResult } from "./hooks/index.js";

// HTML-in-Canvas API types (useful for userland shader/texture code)
export type {
  HtmlInCanvasElement,
  PaintEvent,
  WebGL2RenderingContextWithHtml,
} from "./types.js";
