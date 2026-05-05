// Required for React's act() to work correctly in Vitest.
// https://reactjs.org/docs/test-utils.html#act
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom doesn't implement canvas.getContext — silence the "not implemented"
// warning by returning null, which matches the WebGL-unavailable code path.
HTMLCanvasElement.prototype.getContext = () => null;

// jsdom doesn't implement ResizeObserver — stub it so layout effects don't throw.
(globalThis as Record<string, unknown>).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
