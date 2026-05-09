import type { DragOver } from "./types";

/** Returns updated [onOrder, offOrder] after a drop, or null if the drop is a no-op. */
export function applyDrop(
  from:     string,
  target:   DragOver,
  onOrder:  string[],
  offOrder: string[],
): [newOn: string[], newOff: string[]] | null {
  if (target.type === "row" && target.key === from) return null;

  const toSection = target.type === "section"
    ? target.section
    : (onOrder.includes(target.key) ? "on" : "off");

  const newOn  = onOrder.filter((k) => k !== from);
  const newOff = offOrder.filter((k) => k !== from);
  const list   = toSection === "on" ? newOn : newOff;

  if (target.type === "section") {
    list.push(from);
  } else {
    const ti = list.indexOf(target.key);
    list.splice(target.pos === "after" ? ti + 1 : ti, 0, from);
  }

  return [newOn, newOff];
}

/** Computes a row-level DragOver from cursor position over a container element. */
export function computeRowDragOver(
  containerEl: HTMLElement,
  cursorY:     number,
  keys:        string[],
): DragOver | null {
  if (keys.length === 0) return null;
  const rows = Array.from(containerEl.children) as HTMLElement[];
  for (let i = 0; i < rows.length; i++) {
    const rect = rows[i].getBoundingClientRect();
    if (cursorY < rect.top + rect.height / 2) {
      return { type: "row", key: keys[i], pos: "before" };
    }
  }
  return { type: "row", key: keys[keys.length - 1], pos: "after" };
}

/** Creates an invisible 1×1 drag ghost element and removes it after the next frame. */
export function createDragGhost(e: React.DragEvent): void {
  const ghost = document.createElement("div");
  ghost.style.cssText = "position:fixed;top:-9999px;width:1px;height:1px;";
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  requestAnimationFrame(() => document.body.removeChild(ghost));
}
