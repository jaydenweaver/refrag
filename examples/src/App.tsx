"use client";

import { useEffect, useRef } from "react";
import { HtmlShader, type HtmlShaderHandle } from "refrag";
import crtFrag from "./shaders/crt.frag?raw";

const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est qui dolorem ipsum quia dolor sit.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus itaque earum rerum hic tenetur.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.",
  "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? Neque porro quisquam est qui dolorem.",
  "Ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur voluptatem.",
  "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis molestie dictum semper, enim erat molestie pede, bibendum erat turpis eu lorem. Integer in mauris eu nibh euismod gravida.",
  "Phasellus porttitor, metus non tincidunt dapibus, orci pede pretium neque, sit amet adipiscing ipsum lectus et libero. Aenean bibendum. Curabitur mattis quam id urna. Vivamus dui ligula, varius ut, euismod.",
  "Donec aliquet, tortor sed accumsan bibendum, erat ligula aliquet magna, vitae ornare odio metus a mi. Morbi ac orci et nisl hendrerit mollis. Vestibulum ut nisl mollie nam tempus lorem augue.",
  "Fusce fermentum. Nullam varius nulla. Nunc volutpat convallis mauris. Proin eu sem. Nunc placerat enim vel risus. Sed a ipsum. Nunc aliquam, erat porttitor placerat tincidunt, mi orci iaculis lorem.",
  "Viverra dictum leo vel tortor. Ut a elit sed dolor accumsan blandit et gravida mauris pharetra libero. Integer varius dui vel consequat porta nisl ligula congue neque at luctus ligula mauris pretium.",
];

const CONTENT_STYLE: React.CSSProperties = {
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "4rem 1rem",
  gap: "2rem",
  textAlign: "center",
};

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
      {LOREM.map((p, i) => (
        <p
          key={i}
          style={{
            fontSize: "clamp(1rem, 1.4vw, 1.25rem)",
            lineHeight: 1.6,
            maxWidth: "70ch",
          }}
        >
          {p}
        </p>
      ))}
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
        <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#101924" }}>
          <div ref={innerRef} style={CONTENT_STYLE}>
            <Content />
          </div>
        </div>
      </HtmlShader>
    </>
  );
}
