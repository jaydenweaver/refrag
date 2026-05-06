# CLAUDE.md

**Last updated:** May 2026  
**Project:** `refrag` (npm: `@refrag` or `refrag`)  
**Status:** Early-stage open-source library (pre-v1)

## Project Overview

This is a **lightweight, production-ready React library** that wraps the experimental **HTML-in-Canvas API** (WICG proposal, Chromium origin trial).

HTML-in-Canvas spec can be found here: https://github.com/WICG/html-in-canvas   

It turns the low-level primitives (`layoutsubtree`, `drawElementImage`, `onpaint`, transform syncing) into idiomatic React components + hooks so developers can declaratively render real, interactive, accessible HTML inside `<canvas>` (2D, WebGL, WebGPU) with zero boilerplate.

**Core value proposition:**
- Real DOM + real CSS + real accessibility inside Canvas/WebGL.
- Automatic paint orchestration, transform syncing, resize handling, and React 19 integration.
- Hybrid API: high-level components for 90% of use cases + escape-hatchet primitives/hooks for power users.

**Target users:** Creative coders, Three.js / R3F users, dashboard builders, game UI devs, immersive web experiences.

**Virality goal:** First polished React abstraction for this hot new API → aim for 5k+ GitHub stars in first 3 months via stunning demos.

## Goals & Non-Goals

**Goals:**
- Feel like native React (declarative, composable, TypeScript-first).
- Zero runtime overhead when possible (tree-shakable, React Compiler friendly).
- Excellent DX: great defaults, clear error messages, live playground.
- Hybrid design: components for most users, raw primitives/hooks for advanced control.
- Graceful degradation (fallback to normal DOM when flag is off).
- Ship with beautiful examples (shadcn-style UI inside canvas, R3F integration, shader demos).

**Non-goals:**
- Not a general canvas rendering engine (no replacement for Konva or react-canvas).
- Not a polyfill (we assume the native API or let users bring their own).
- No heavy dependencies (React only + optional peer deps).

## Tech Stack

- **Framework:** React 19+ (uses `useSyncExternalStore`, `useActionState`, `useTransition`, `useOptimistic`, React Compiler awareness)
- **Language:** TypeScript (strict mode, `strictNullChecks`, `exactOptionalPropertyTypes`)
- **Build:** 
  - `tsup` (library mode) + `vite` (for examples/playground)
  - Dual ESM + CJS output, tree-shaking enabled
- **Styling:** Tailwind CSS + `class-variance-authority` (cva) + `tailwind-merge` for component examples
- **Testing:** Vitest
- **Linting/Formatting:** ESLint (Airbnb + React Hooks + TypeScript), Prettier, `eslint-plugin-react-compiler`
- **Documentation:** Docusaurus
- **Peer deps:** `react`, `react-dom` (≥19)
- **Zero runtime deps** for core (optional peer: `@react-three/fiber` for examples)

## Architecture

**High-level design (hybrid pattern — proven by TanStack, shadcn, Framer Motion):**

1. **Core Layer** (`src/core/`): Vanilla-like primitives that mirror the native API but are safe in React.
2. **Hooks Layer** (`src/hooks/`): `useHtmlCanvas`, `useDrawElement`, `useOnPaint`, `useHtmlTexture` (WebGL), `useCanvasSync`.
3. **Component Layer** (`src/components/`): Built on top of hooks.
   - `<HtmlCanvas>` (root, provides context + `layoutsubtree`)
   - `<HtmlLayer>` / `<HtmlElement>` (declarative positioned content with position/scale/rotation props)
4. **Context & Provider:** Internal `HtmlCanvasContext` using `useSyncExternalStore` for paint events and transform state.
5. **Automatic syncing:** Library handles `onpaint` subscription, `requestPaint()` on React updates, transform matrix application, ResizeObserver + devicePixelRatio.
6. **Extensibility:** Full escape hatches — expose raw context, allow custom `onPaint` handlers, WebGL/WebGPU context passthrough.

**Key React best practices enforced:**
- **Client-only:** All components marked `"use client"` (Next.js compatible).
- **React 19 first:** Prefer `useActionState`, `useOptimistic`, transitions; avoid unnecessary `useEffect`.
- **No tearing:** Always use `useSyncExternalStore` for external canvas state.
- **Performance:** Fine-grained updates, minimal re-renders, `React.memo` only where needed, React Compiler safe (no banned patterns).
- **Accessibility:** Preserve real DOM for ARIA/focus/tab; never break screen readers.
- **Type safety:** Full generics, discriminated unions for context types.
- **Error boundaries & fallbacks:** Clear runtime errors when flag is disabled.
- **Forward refs + imperative handles** for advanced control.
- **Tree-shakable:** Barrel files only export what's needed.

**Important rules:**
- Everything in `src/` must be tree-shakable.
- No default exports except for the main barrel.
- All components/hooks fully documented with JSDoc + examples.
- Tests live next to source when possible (`component.test.tsx`).

## Coding Style & Conventions

- **Components:** Always functional, named exports, `forwardRef` + `displayName`.
- **Hooks:** Prefix with `use`, follow Rules of Hooks strictly.
- **Types:** Prefer interfaces for props, type aliases for complex unions.
- **Styling:** Use `cva` for variants; never inline styles except for dynamic transforms.
- **State management:** Internal only (no external store required); users bring their own (Zustand, TanStack, etc.).
- **Comments:** Explain "why", not "what". Keep code self-documenting. Only use when code could be confusing.
- **Error messages:** User-friendly, point to docs.
- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).

**React-specific rules (always follow):**
- Never use `useEffect` for layout/side-effects that belong in `useLayoutEffect`.
- Prefer `useTransition` for paint-triggered updates.
- Mark all canvas-related code as `// React Compiler safe`.
- Components must work in Strict Mode (double-mount safe).
- No `any` — use `unknown` or proper generics.

## Development Workflow

- `pnpm dev` → starts examples playground
- `pnpm build` → tsup library build
- `pnpm test` → Vitest
- `pnpm lint` → ESLint + compiler plugin
- Before PR: run `pnpm build && pnpm test && pnpm lint`

**When adding new features:**
1. Start with core primitive/hook.
2. Add component wrapper.
3. Add example in `/examples`.
4. Update types + JSDoc.

This CLAUDE.md is the single source of truth. When in doubt, follow the architecture above and React 19 best practices. Let's build the first truly delightful React wrapper for HTML-in-Canvas.
