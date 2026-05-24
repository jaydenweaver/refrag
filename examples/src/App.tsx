"use client";

import { useEffect, useRef } from "react";
import { HtmlShader, type HtmlShaderHandle } from "refrag";
import { useShaderEditor } from "./hooks/useShaderEditor";
import { useShockwave }    from "./hooks/useShockwave";
import { Sidebar }         from "./components/Sidebar";
import { Content }         from "./components/Content";
import { CONTENT_STYLE }   from "./components/Content/styles";

export function App() {
  const shaderRef = useRef<HtmlShaderHandle>(null);
  const innerRef  = useRef<HTMLDivElement>(null);

  const editor    = useShaderEditor();
  const shockwave = useShockwave();

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
      <Sidebar editor={editor} />

      {/* Invisible spacer — makes the page scrollable */}
      <div aria-hidden style={{ ...CONTENT_STYLE, visibility: "hidden", pointerEvents: "none" }}>
        <Content />
      </div>

      <HtmlShader
        ref={shaderRef}
        frag={editor.frag}
        uniforms={[
          { name: "u_shock_pos", value: shockwave.shockPosRef.current },
          { name: "u_shock_t",   value: shockwave.shockT },
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
