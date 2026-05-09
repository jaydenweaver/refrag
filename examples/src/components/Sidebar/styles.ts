import type React from "react";
import type { SidebarPosition } from "./types";

export const DIVIDER = "1px solid rgba(255,255,255,0.09)";

export const MONO_SM: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize:   "0.7rem",
};

export function sidebarStyle(pos: SidebarPosition): React.CSSProperties {
  return {
    position:             "fixed",
    zIndex:               50,
    ...(pos
      ? { top: pos.y, left: pos.x }
      : { top: "50%", right: "1.25rem", transform: "translateY(-50%)" }),
    display:              "flex",
    flexDirection:        "row",
    background:           "rgba(12,12,12,0.6)",
    backdropFilter:       "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    maxHeight:            "90vh",
  };
}
