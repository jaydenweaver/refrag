"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HtmlShader, type HtmlShaderHandle } from "refrag";
import crtFrag from "./shaders/crt.frag?raw";
import ditherFrag from "./shaders/dither.frag?raw";
import liquidwarpFrag from "./shaders/liquidwarp.frag?raw";
import mouseFrag from "./shaders/mouse.frag?raw";
import particlesFrag from "./shaders/particles.frag?raw";
import shockwaveFrag from "./shaders/shockwave.frag?raw";

const PASSTHROUGH_FRAG = `#version 300 es
precision mediump float;
uniform sampler2D u_texture;
in vec2 v_uv;
out vec4 out_color;
void main() { out_color = texture(u_texture, v_uv); }
`;
import Corners from "./Corners";

const RESEARCH_QUOTES = [
  {
    quote: "We observe the emergence of population-level phenomena, including the propagation of information, attitudes, and emotions.",
    author: "Gao et al. (2023).",
    paper: "S³: Social-network Simulation System with Large Language Model-Empowered Agents.",
  },
];

function ResearchQuotes() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("research-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="research-section" style={{ width: "100%", maxWidth: "100ch" }}>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.09)" }}>
        {RESEARCH_QUOTES.map((item, i) => (
          <div
            key={i}
            className="research-row group relative"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.09)", padding: "1.5rem 2.5rem", cursor: "default", overflow: "hidden", position: "relative" }}
          >
            <Corners />
            <div className="research-row-inner" style={{ animationDelay: `${(i + 1) * 90}ms` }}>
              <p style={{ ...textStyle, margin: 0, fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", lineHeight: 1.3 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                <div className="overflow-hidden">
                  <p style={{ ...textStyle, paddingTop: "0.75rem", margin: 0, fontSize: "1rem", lineHeight: 1.5 }}
                     className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    &mdash; {item.author} <em>{item.paper}</em>
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CONTENT_STYLE: React.CSSProperties = {
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "6rem 1rem",
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
      ctx.fillStyle = "#0c0c0c";
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
          lineHeight: 1,
        }}
      >
        text
      </h1>
      <div style={{...textStyle, ...CONTENT_STYLE, padding: "0", maxWidth: "50ch"}}>
      <div>
        this is a demo of the refrag library, which allows you to apply shaders to HTML content using the {'<HtmlShader>'} component.
      </div>
      <div>
        the HTML content on this page is nested in a {'<HtmlShader>'}.
         </div>
      <div>
        use the sidebar to toggle different shaders.
        shaders are rendered in the order they appear in the sidebar (top to bottom), and can be rearranged via drag-and-drop.
      </div>
      <div>
        an {'<img>'} of a red panda. 😴
      </div>
      <img
        src="/images/red-panda-sq.jpg"
        style={{ width: 400, height: 300, objectFit: "cover", display: "block" }}
      />
      <div style={{marginBottom: "-1.5rem"}}>
        an animated {'<canvas>'}.
      </div>
      <AnimatedCanvas />

      <div style={{marginBottom: "-1.5rem"}}>
        an element with animations (try hovering over it).
      </div></div>
      <ResearchQuotes />
    </>
  );
}

const SHADERS = [
  { key: "crt",        label: "CRT",        frag: crtFrag },
  { key: "dither",     label: "dither",     frag: ditherFrag },
  { key: "liquidwarp", label: "liquid",     frag: liquidwarpFrag },
  { key: "mouse",      label: "mouse",      frag: mouseFrag },
  { key: "particles",  label: "particles",  frag: particlesFrag },
  { key: "shockwave",  label: "shockwave",  frag: shockwaveFrag },
] as const;

type ShaderKey = typeof SHADERS[number]["key"];

function Toggle({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0" }}
    >
      <span style={{ color: on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)", fontSize: "0.7rem", fontFamily: "monospace", transition: "color 0.15s ease" }}>
        {label}
      </span>
      <span style={{ display: "inline-flex", width: "2rem", height: "1.125rem", borderRadius: "9999px", padding: "0.125rem", background: on ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)", transition: "background 0.2s ease", alignItems: "center" }}>
        <span style={{ width: "0.875rem", height: "0.875rem", borderRadius: "9999px", background: on ? "#0c0c0c" : "rgba(255,255,255,0.35)", transform: on ? "translateX(0.875rem)" : "translateX(0)", transition: "transform 0.2s ease, background 0.2s ease", display: "block" }} />
      </span>
    </button>
  );
}

export function App() {
  const shaderRef = useRef<HtmlShaderHandle>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [onOrder,  setOnOrder]  = useState<ShaderKey[]>(() => ["crt"]);
  const [offOrder, setOffOrder] = useState<ShaderKey[]>(() => SHADERS.filter((s) => s.key !== "crt").map((s) => s.key));
  const dragKeyRef = useRef<ShaderKey | null>(null);
  type DragOver =
    | { type: "row";     key: ShaderKey; pos: "before" | "after" }
    | { type: "section"; section: "on" | "off" };
  const [dragOver, setDragOver] = useState<DragOver | null>(null);

  const sidebarRef = useRef<HTMLElement>(null);
  const [sidebarPos, setSidebarPos] = useState<{ x: number; y: number } | null>(null);
  const sidebarDragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = sidebarRef.current!.getBoundingClientRect();
    sidebarDragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
    const onMove = (ev: PointerEvent) => {
      const d = sidebarDragRef.current!;
      const el = sidebarRef.current!;
      const maxX = window.innerWidth  - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      setSidebarPos({
        x: Math.max(0, Math.min(d.origX + ev.clientX - d.startX, maxX)),
        y: Math.max(0, Math.min(d.origY + ev.clientY - d.startY, maxY)),
      });
    };
    const onUp = () => {
      sidebarDragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const onDragStart = (key: ShaderKey, e: React.DragEvent) => {
    dragKeyRef.current = key;
    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-9999px;width:1px;height:1px;";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    requestAnimationFrame(() => document.body.removeChild(ghost));
  };
  const onRowsDragOver = (e: React.DragEvent, section: "on" | "off") => {
    e.preventDefault();
    const keys = section === "on" ? onOrder : offOrder;
    if (keys.length === 0) { setDragOver({ type: "section", section }); return; }
    const rows = Array.from((e.currentTarget as HTMLElement).children) as HTMLElement[];
    const cursorY = e.clientY;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (cursorY < rect.top + rect.height / 2) {
        setDragOver({ type: "row", key: keys[i], pos: "before" });
        return;
      }
    }
    setDragOver({ type: "row", key: keys[keys.length - 1], pos: "after" });
  };
  const onSectionLabelDragOver = (e: React.DragEvent, section: "on" | "off") => {
    e.preventDefault();
    setDragOver({ type: "section", section });
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragKeyRef.current;
    const target = dragOver;
    if (!from || !target) { setDragOver(null); return; }
    if (target.type === "row" && target.key === from) { setDragOver(null); return; }

    const toSection = target.type === "section" ? target.section : (onOrder.includes(target.key) ? "on" : "off");
    const newOn  = onOrder.filter((k) => k !== from);
    const newOff = offOrder.filter((k) => k !== from);
    const list   = toSection === "on" ? newOn : newOff;

    if (target.type === "section") {
      list.push(from);
    } else {
      const ti = list.indexOf(target.key);
      list.splice(target.pos === "after" ? ti + 1 : ti, 0, from);
    }

    setOnOrder(newOn);
    setOffOrder(newOff);
    dragKeyRef.current = null;
    setDragOver(null);
  };

  // Build the ordered frag array from ON shaders, falling back to passthrough.
  // Memoized so array reference is stable between shock-driven re-renders.
  const frag = useMemo(() => {
    const frags = onOrder.map((key) => SHADERS.find((s) => s.key === key)!.frag);
    return frags.length > 0 ? frags : PASSTHROUGH_FRAG;
  }, [onOrder]);

  // Shockwave: track click position + elapsed time as custom uniforms.
  const shockPosRef = useRef<[number, number]>([0.5, 0.5]);
  const shockStartRef = useRef(-Infinity);
  const shockRafRef = useRef(0);
  const [shockT, setShockT] = useState(999);

  useEffect(() => {
    const DURATION = 1.2;
    const tick = () => {
      const t = (performance.now() - shockStartRef.current) / 1000;
      if (t < DURATION) {
        setShockT(t);
        shockRafRef.current = requestAnimationFrame(tick);
      } else {
        setShockT(999);
      }
    };
    const onDown = (e: MouseEvent) => {
      shockPosRef.current = [e.clientX / window.innerWidth, e.clientY / window.innerHeight];
      shockStartRef.current = performance.now();
      cancelAnimationFrame(shockRafRef.current);
      shockRafRef.current = requestAnimationFrame(tick);
    };
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(shockRafRef.current);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (innerRef.current) innerRef.current.style.marginTop = `-${window.scrollY}px`;
      shaderRef.current?.requestPaint();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Floating sidebar — lives outside HtmlShader so it's always crisp */}
      <aside ref={sidebarRef} style={{
        position: "fixed", zIndex: 50,
        ...(sidebarPos
          ? { top: sidebarPos.y, left: sidebarPos.x }
          : { top: "50%", right: "1.25rem", transform: "translateY(-50%)" }),
        display: "flex", flexDirection: "column",
        background: "rgba(12,12,12,0.6)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Header — drag handle for repositioning the sidebar */}
        <div
          onPointerDown={onHeaderPointerDown}
          style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.09)", cursor: "move", userSelect: "none" }}
        >
          <span style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em" }}>
            refrag
          </span>
        </div>
        {/* ON / OFF sections */}
        {(["on", "off"] as const).map((section) => {
          const keys = section === "on" ? onOrder : offOrder;
          const isSectionOver = dragOver?.type === "section" && dragOver.section === section;
          return (
            <div key={section}>
              {/* Section label — drop target for appending to section */}
              <div
                onDragOver={(e) => onSectionLabelDragOver(e, section)}
                onDrop={onDrop}
                style={{
                  padding: "0.4rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.09)",
                  background: isSectionOver ? "rgba(255,255,255,0.04)" : "transparent",
                  transition: "background 0.15s ease",
                  userSelect: "none",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: "0.08em" }}>
                  {section.toUpperCase()}
                </span>
              </div>
              {/* Shader rows — container handles all drag-over detection */}
              <div
                onDragOver={(e) => onRowsDragOver(e, section)}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
                onDrop={onDrop}
              >
                {keys.map((key) => {
                  const s = SHADERS.find((x) => x.key === key)!;
                  const isOver = dragOver?.type === "row" && dragOver.key === s.key;
                  return (
                    <div
                      key={s.key}
                      draggable
                      onDragStart={(e) => onDragStart(s.key, e)}
                      onDragEnd={() => setDragOver(null)}
                      style={{
                        position: "relative", overflow: "hidden",
                        padding: "0.6rem 1.25rem",
                        borderBottom: "1px solid rgba(255,255,255,0.09)",
                        cursor: "grab",
                      }}
                    >
                      {isOver && dragOver?.type === "row" && dragOver.pos === "before" && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#fff", zIndex: 1 }} />
                      )}
                      {isOver && dragOver?.type === "row" && dragOver.pos === "after" && (
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "#fff", zIndex: 1 }} />
                      )}
                      <Corners />
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.7rem", fontFamily: "monospace" }}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </aside>

      {/* Invisible copy — makes the page scrollable */}
      <div aria-hidden style={{ ...CONTENT_STYLE, visibility: "hidden", pointerEvents: "none" }}>
        <Content />
      </div>

      <HtmlShader
        ref={shaderRef}
        frag={frag}
        uniforms={[
          { name: "u_shock_pos", value: shockPosRef.current },
          { name: "u_shock_t",   value: shockT },
        ]}
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
