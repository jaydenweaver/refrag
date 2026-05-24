import { useRef, useState } from "react";
import type { ShaderEntry } from "../../types";
import type { DragOver } from "./types";
import { applyDrop, computeRowDragOver, createDragGhost } from "./utils";
import { ShaderRow } from "./ShaderRow";
import { DIVIDER, MONO_SM } from "./styles";

type Props = {
  shaders:       ShaderEntry[];
  onOrder:       string[];
  offOrder:      string[];
  selectedKey:   string | null;
  panelOpen:     boolean;
  isDirty:       (key: string) => boolean;
  onOrderChange: (newOn: string[], newOff: string[]) => void;
  onRowClick:    (key: string) => void;
};

export function ShaderList({ shaders, onOrder, offOrder, selectedKey, panelOpen, isDirty, onOrderChange, onRowClick }: Props) {
  const dragKeyRef = useRef<string | null>(null);
  const [dragOver, setDragOver] = useState<DragOver | null>(null);

  const handleDragStart = (key: string, e: React.DragEvent) => {
    dragKeyRef.current = key;
    createDragGhost(e);
  };

  const handleRowsDragOver = (e: React.DragEvent, section: "on" | "off") => {
    e.preventDefault();
    const keys = section === "on" ? onOrder : offOrder;
    if (keys.length === 0) { setDragOver({ type: "section", section }); return; }
    const result = computeRowDragOver(e.currentTarget as HTMLElement, e.clientY, keys);
    if (result) setDragOver(result);
  };

  const handleSectionLabelDragOver = (e: React.DragEvent, section: "on" | "off") => {
    e.preventDefault();
    setDragOver({ type: "section", section });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const from   = dragKeyRef.current;
    const target = dragOver;
    if (!from || !target) { setDragOver(null); return; }
    const result = applyDrop(from, target, onOrder, offOrder);
    if (result) onOrderChange(result[0], result[1]);
    dragKeyRef.current = null;
    setDragOver(null);
  };

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {(["on", "off"] as const).map((section) => {
        const keys          = section === "on" ? onOrder : offOrder;
        const isSectionOver = dragOver?.type === "section" && dragOver.section === section;

        return (
          <div key={section}>
            {/* Section label — drop target for appending to section */}
            <div
              onDragOver={(e) => handleSectionLabelDragOver(e, section)}
              onDrop={handleDrop}
              style={{
                padding:      "0.4rem 1.25rem",
                borderBottom: DIVIDER,
                background:   isSectionOver ? "rgba(255,255,255,0.04)" : "transparent",
                transition:   "background 0.15s ease",
                userSelect:   "none",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.35)", ...MONO_SM, letterSpacing: "0.08em" }}>
                {section.toUpperCase()}
              </span>
            </div>

            {/* Rows */}
            <div
              onDragOver={(e) => handleRowsDragOver(e, section)}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={handleDrop}
            >
              {keys.map((key) => {
                const shader = shaders.find((s) => s.key === key);
                if (!shader) return null;
                return (
                  <ShaderRow
                    key={shader.key}
                    shader={shader}
                    isActive={selectedKey === shader.key && panelOpen}
                    isDirty={isDirty(shader.key)}
                    dragOver={dragOver}
                    onDragStart={(e) => handleDragStart(shader.key, e)}
                    onDragEnd={() => setDragOver(null)}
                    onClick={() => onRowClick(shader.key)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
