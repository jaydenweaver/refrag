import { AnimatedCanvas } from "./AnimatedCanvas";
import { ResearchQuotes } from "./ResearchQuotes";
import { TEXT_STYLE } from "./styles";

export function Content() {
  return (
    <>
      <h1
        style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontSize:   "clamp(6rem, 22vw, 22rem)",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        text
      </h1>

      <div style={{ ...TEXT_STYLE, display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem", padding: "0", maxWidth: "50ch" }}>
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
        <div style={{ marginBottom: "-1.5rem" }}>
          an animated {'<canvas>'}.
        </div>
        <AnimatedCanvas />
        <div style={{ marginBottom: "-1.5rem" }}>
          an element with animations (try hovering over it).
        </div>
      </div>

      <ResearchQuotes />
    </>
  );
}
