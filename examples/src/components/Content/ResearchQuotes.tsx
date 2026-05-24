import { useEffect, useRef } from "react";
import Corners from "../../Corners";
import { TEXT_STYLE } from "./styles";

const RESEARCH_QUOTES = [
  {
    quote:  "We observe the emergence of population-level phenomena, including the propagation of information, attitudes, and emotions.",
    author: "Gao et al. (2023).",
    paper:  "S³: Social-network Simulation System with Large Language Model-Empowered Agents.",
  },
];

export function ResearchQuotes() {
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
              <p style={{ ...TEXT_STYLE, margin: 0, fontSize: "clamp(1.05rem, 1.8vw, 1.35rem)", lineHeight: 1.3 }}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
                <div className="overflow-hidden">
                  <p
                    style={{ ...TEXT_STYLE, paddingTop: "0.75rem", margin: 0, fontSize: "1rem", lineHeight: 1.5 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100"
                  >
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
