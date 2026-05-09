import { useRef, useState } from "react";
import type { UseShaderEditorReturn } from "../../hooks/useShaderEditor";
import { ShaderList } from "./ShaderList";
import { EditorPanel } from "./EditorPanel";
import { sidebarStyle, DIVIDER } from "./styles";
import type { SidebarPosition } from "./types";

type Props = {
  editor: UseShaderEditorReturn;
};

export function Sidebar({ editor }: Props) {
  const sidebarRef     = useRef<HTMLElement>(null);
  const [pos, setPos]  = useState<SidebarPosition>(null);
  const dragRef        = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = sidebarRef.current!.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };

    const onMove = (ev: PointerEvent) => {
      const d   = dragRef.current!;
      const el  = sidebarRef.current!;
      const maxX = window.innerWidth  - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;
      setPos({
        x: Math.max(0, Math.min(d.origX + ev.clientX - d.startX, maxX)),
        y: Math.max(0, Math.min(d.origY + ev.clientY - d.startY, maxY)),
      });
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const {
    shaders, onOrder, offOrder, setOnOrder, setOffOrder,
    selectedKey, panelOpen, setPanelOpen,
    draftCode, draftName, setDraftCode, setDraftName,
    openPanel, handleSave, handleAddShader,
    isDirty, getEditorCode, getEditorName,
  } = editor;

  const handleRowClick = (key: string) => {
    if (selectedKey === key && panelOpen) setPanelOpen(false);
    else openPanel(key);
  };

  const selectedShader = selectedKey ? shaders.find((s) => s.key === selectedKey) : undefined;

  return (
    <aside ref={sidebarRef} style={sidebarStyle(pos)}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: "5rem", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Header / drag handle */}
        <div
          onPointerDown={onHeaderPointerDown}
          style={{
            padding:         "0.75rem 1.25rem",
            borderBottom:    DIVIDER,
            cursor:          "move",
            userSelect:      "none",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "space-between",
            gap:             "0.5rem",
          }}
        >
          <span style={{ color: "#fff", fontFamily: "Georgia, serif", fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em" }}>
            refrag
          </span>
          <AddButton onClick={() => handleAddShader()} />
        </div>

        <ShaderList
          shaders={shaders}
          onOrder={onOrder}
          offOrder={offOrder}
          selectedKey={selectedKey}
          panelOpen={panelOpen}
          isDirty={isDirty}
          onOrderChange={(newOn, newOff) => { setOnOrder(newOn); setOffOrder(newOff); }}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Right column: editor panel */}
      {panelOpen && selectedKey && selectedShader && (
        <EditorPanel
          editorName={getEditorName(selectedKey)}
          editorCode={getEditorCode(selectedKey)}
          isDirty={isDirty(selectedKey)}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
          onNameChange={(name) => setDraftName((prev) => ({ ...prev, [selectedKey]: name }))}
          onCodeChange={(code) => setDraftCode((prev) => ({ ...prev, [selectedKey]: code }))}
        />
      )}
    </aside>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title="New shader"
      style={{
        background:  "none",
        border:      "none",
        cursor:      "pointer",
        color:       "rgba(255,255,255,0.45)",
        fontSize:    "1.1rem",
        lineHeight:  1,
        padding:     "0.1rem 0.2rem",
        display:     "flex",
        alignItems:  "center",
        transition:  "color 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
    >
      +
    </button>
  );
}
