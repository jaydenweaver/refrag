import { DIVIDER, MONO_SM } from "./styles";

type Props = {
  editorName:   string;
  editorCode:   string;
  isDirty:      boolean;
  onClose:      () => void;
  onSave:       () => void;
  onNameChange: (name: string) => void;
  onCodeChange: (code: string) => void;
};

export function EditorPanel({ editorName, editorCode, isDirty, onClose, onSave, onNameChange, onCodeChange }: Props) {
  const saved = !isDirty;

  return (
    <div
      style={{
        width:         440,
        border:        "1px solid rgba(255,255,255,0.06)",
        borderLeft:    "none",
        display:       "flex",
        flexDirection: "column",
        overflow:      "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:     "0.75rem 1.25rem",
          marginBottom: "-1px",
          display:     "flex",
          alignItems:  "center",
          gap:         "0.5rem",
          flexShrink:  0,
        }}
      >
        <CollapseButton onClose={onClose} />

        <input
          value={editorName}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            background:   "none",
            border:       "none",
            outline:      "none",
            color:        "#fff",
            ...MONO_SM,
            flex:         1,
            minWidth:     0,
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}
        />

        <SaveButton saved={saved} onSave={onSave} />
      </div>

      {/* Code textarea */}
      <textarea
        value={editorCode}
        onChange={(e) => onCodeChange(e.target.value)}
        spellCheck={false}
        style={{
          flex:        1,
          background:  "transparent",
          border:      "none",
          outline:     "none",
          color:       "rgba(255,255,255,0.75)",
          fontFamily:  "monospace",
          fontSize:    "0.68rem",
          lineHeight:  1.6,
          padding:     "0.75rem 1rem",
          resize:      "none",
          minHeight:   320,
          overflowY:   "auto",
          tabSize:     2,
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const el    = e.currentTarget;
            const start = el.selectionStart;
            const end   = el.selectionEnd;
            const next  = el.value.substring(0, start) + "  " + el.value.substring(end);
            onCodeChange(next);
            requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
          }
        }}
      />
    </div>
  );
}

function CollapseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      title="Collapse"
      style={{
        background:  "none",
        border:      "none",
        cursor:      "pointer",
        color:       "rgba(255,255,255,0.4)",
        fontSize:    "1rem",
        padding:     0,
        lineHeight:  1,
        transition:  "color 0.15s ease",
        flexShrink:  0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
    >
      ←
    </button>
  );
}

function SaveButton({ saved, onSave }: { saved: boolean; onSave: () => void }) {
  return (
    <button
      onClick={onSave}
      disabled={saved}
      style={{
        background:  "none",
        border:      "1px solid rgba(255,255,255,0.15)",
        cursor:      saved ? "default" : "pointer",
        color:       saved ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
        ...MONO_SM,
        padding:     "0.2rem 0.55rem",
        transition:  "color 0.15s ease, border-color 0.15s ease",
        flexShrink:  0,
      }}
      onMouseEnter={(e) => {
        if (!saved) {
          e.currentTarget.style.color       = "#fff";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color       = saved ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
      }}
    >
      save
    </button>
  );
}
