import type React from "react";

export const CONTENT_STYLE: React.CSSProperties = {
  color:         "#ffffff",
  display:       "flex",
  flexDirection: "column",
  alignItems:    "center",
  padding:       "6rem 1rem",
  gap:           "2rem",
  textAlign:     "center",
};

export const TEXT_STYLE: React.CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
  fontSize:   "clamp(1rem, 1.4vw, 1.25rem)",
  lineHeight: 1.6,
  maxWidth:   "80ch",
};
