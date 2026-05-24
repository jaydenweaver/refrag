import { useState } from "react";
import Corners from "../../Corners";
import type { ShaderEntry } from "../../types";
import type { DragOver } from "./types";
import { DIVIDER, MONO_SM } from "./styles";

type Props = {
  shader:      ShaderEntry;
  isActive:    boolean;
  isDirty:     boolean;
  dragOver:    DragOver | null;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd:   () => void;
  onClick:     () => void;
};

export function ShaderRow({ shader, isActive, isDirty, dragOver, onDragStart, onDragEnd, onClick }: Props) {
  const [hovered, setHovered] = useState(false);

  const isDropBefore = dragOver?.type === "row" && dragOver.key === shader.key && dragOver.pos === "before";
  const isDropAfter  = dragOver?.type === "row" && dragOver.key === shader.key && dragOver.pos === "after";

  const bg = isActive ? "rgba(255,255,255,0.05)" : hovered ? "rgba(255,255,255,0.03)" : "transparent";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:    "relative",
        overflow:    "hidden",
        padding:     "0.6rem 1.25rem",
        borderBottom: DIVIDER,
        cursor:      "pointer",
        background:  bg,
        transition:  "background 0.15s ease",
      }}
    >
      {isDropBefore && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "#fff", zIndex: 1 }} />
      )}
      {isDropAfter && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "#fff", zIndex: 1 }} />
      )}
      <Corners />
      <span style={{ color: "rgba(255,255,255,0.7)", ...MONO_SM }}>
        {isDirty && <span style={{ color: "rgba(255,255,255,0.4)", marginRight: "0.15rem" }}>*</span>}
        {shader.label}
      </span>
    </div>
  );
}
