"use client";

import { useState } from "react";
import { HtmlShader } from "refrag";
import glitchFrag from "./shaders/glitch.frag?raw";
import mouseFrag from "./shaders/mouse.frag?raw";

const TAGS = ["React 19", "WebGL2", "TypeScript", "HTML-in-Canvas"];

const SHADERS = [
  { id: "mouse", label: "mouse.frag", frag: mouseFrag, caption: "bulge lens + chromatic aberration" },
  { id: "glitch", label: "glitch.frag", frag: glitchFrag, caption: "RGB glitch + scanlines — hold to intensify" },
] as const;

type ShaderId = (typeof SHADERS)[number]["id"];

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    background: "#020617",
    fontFamily: '"Inter", system-ui, sans-serif',
    gap: "1.5rem",
    padding: "2rem",
  },
  card: {
    width: "100%",
    height: "100%",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 60%, #0f172a 100%)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "1.25rem",
    padding: "3rem",
    boxSizing: "border-box" as const,
  },
  eyebrow: {
    fontSize: "0.7rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: "#475569",
  },
  heading: {
    fontSize: "3rem",
    fontWeight: 700,
    margin: 0,
    background: "linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textAlign: "center" as const,
    lineHeight: 1.1,
  },
  body: {
    fontSize: "1rem",
    color: "#64748b",
    textAlign: "center" as const,
    maxWidth: "380px",
    lineHeight: 1.6,
    margin: 0,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "0.5rem",
    justifyContent: "center",
    marginTop: "0.25rem",
  },
  tag: {
    padding: "0.3rem 0.8rem",
    borderRadius: "9999px",
    border: "1px solid #1e293b",
    color: "#475569",
    fontSize: "0.7rem",
    letterSpacing: "0.05em",
    background: "#0f172a",
  },
  controls: {
    display: "flex",
    gap: "0.5rem",
  },
  caption: {
    fontSize: "0.75rem",
    color: "#1e293b",
    letterSpacing: "0.05em",
  },
} satisfies Record<string, React.CSSProperties>;

function shaderButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "0.35rem 0.9rem",
    borderRadius: "9999px",
    border: `1px solid ${active ? "#4f46e5" : "#1e293b"}`,
    background: active ? "#1e1b4b" : "#0f172a",
    color: active ? "#818cf8" : "#475569",
    fontSize: "0.7rem",
    letterSpacing: "0.05em",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  };
}

export function App() {
  const [activeId, setActiveId] = useState<ShaderId>("mouse");
  const active = SHADERS.find((s) => s.id === activeId)!;

  return (
    <main style={styles.page}>
      <HtmlShader frag={active.frag} width={640} height={420}>
        <div style={styles.card}>
          <span style={styles.eyebrow}>refrag</span>

          <h1 style={styles.heading}>
            HTML inside
            <br />
            Canvas
          </h1>

          <p style={styles.body}>
            Real DOM. Real CSS. Real accessibility.
            <br />
            Rendered as a live WebGL texture.
          </p>

          <div style={styles.tags}>
            {TAGS.map((tag) => (
              <span key={tag} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </HtmlShader>

      <div style={styles.controls}>
        {SHADERS.map((s) => (
          <button key={s.id} style={shaderButtonStyle(s.id === activeId)} onClick={() => setActiveId(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      <p style={styles.caption}>{active.caption}</p>
    </main>
  );
}
