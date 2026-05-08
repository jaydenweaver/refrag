"use client";

import { useEffect, useRef } from "react";
import { HtmlShader, type HtmlShaderHandle } from "refrag";
import crtFrag from "./shaders/crt.frag?raw";

const CONTENT_STYLE: React.CSSProperties = {
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "4rem 1rem",
  gap: "2rem",
  textAlign: "center",
};

const textStyle: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
  fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
  lineHeight: 1.6,
  maxWidth: "80ch",
};

function AnimatedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const start = performance.now();

    const draw = () => {
      const t = (performance.now() - start) / 1000;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, w, h);

      // Rotating gradient circle
      const cx = w / 2 + Math.cos(t) * 40;
      const cy = h / 2 + Math.sin(t * 1.3) * 20;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      grad.addColorStop(0, `hsl(${(t * 60) % 360}, 100%, 70%)`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("canvas element", w / 2, h - 12);

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} width={400} height={240} style={{ display: "block" }} />;
}

function Content() {
  return (
    <>
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontSize: "clamp(6rem, 22vw, 22rem)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        text
      </h1>
      <div style={{...textStyle}}>
        this is a demo of the HtmlShader component, which allows you to apply a shader effect to any HTML content.
      </div>
      <div style={{...textStyle}}>
        the HTML content on this page is using a CRT shader, which gives the content a retro, pixelated look. you can scroll down to see more content and the shader effect will be applied to all of it.
      </div>
      <img
        src="/images/red-panda-sq.jpg"
        style={{ width: 400, height: 300, objectFit: "cover", display: "block" }}
      />
      <AnimatedCanvas />
    </>
  );
}

export function App() {
  const shaderRef = useRef<HtmlShaderHandle>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (innerRef.current) {
        innerRef.current.style.marginTop = `-${window.scrollY}px`;
      }
      shaderRef.current?.requestPaint();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/*
       * Invisible copy in normal document flow. Its natural height makes the
       * page scrollable — no measurement or spacer calculation needed. The
       * browser provides a real scrollbar, keyboard shortcuts, and momentum.
       */}
      <div aria-hidden style={{ ...CONTENT_STYLE, visibility: "hidden", pointerEvents: "none" }}>
        <Content />
      </div>

      <HtmlShader
        ref={shaderRef}
        frag={crtFrag}
        style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#0c0c0c" }}>
          <div ref={innerRef} style={CONTENT_STYLE}>
            <Content />
          </div>
        </div>
      </HtmlShader>
    </>
  );
}
