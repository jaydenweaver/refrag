export type DragOver =
  | { type: "row";     key: string; pos: "before" | "after" }
  | { type: "section"; section: "on" | "off" };

export type SidebarPosition = { x: number; y: number } | null;
