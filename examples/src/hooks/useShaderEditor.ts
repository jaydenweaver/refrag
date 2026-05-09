import { useEffect, useMemo, useRef, useState } from "react";
import { INITIAL_SHADERS, PASSTHROUGH_FRAG } from "../constants";
import type { ShaderEntry } from "../types";

export type UseShaderEditorReturn = {
  shaders:    ShaderEntry[];
  onOrder:    string[];
  offOrder:   string[];
  setOnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setOffOrder: React.Dispatch<React.SetStateAction<string[]>>;
  frag:       string | string[];

  selectedKey: string | null;
  panelOpen:   boolean;
  setPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  draftCode:   Record<string, string>;
  draftName:   Record<string, string>;
  setDraftCode: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setDraftName: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  openPanel:       (key: string) => void;
  handleSave:      () => void;
  handleAddShader: () => void;

  getShader:     (key: string) => ShaderEntry | undefined;
  getEditorCode: (key: string) => string;
  getEditorName: (key: string) => string;
  isDirty:       (key: string) => boolean;
};

export function useShaderEditor(): UseShaderEditorReturn {
  const [shaders,  setShaders]  = useState<ShaderEntry[]>(INITIAL_SHADERS);
  const [onOrder,  setOnOrder]  = useState<string[]>(() => ["crt"]);
  const [offOrder, setOffOrder] = useState<string[]>(() =>
    INITIAL_SHADERS.filter((s) => s.key !== "crt").map((s) => s.key)
  );

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [draftCode,   setDraftCode]   = useState<Record<string, string>>({});
  const [draftName,   setDraftName]   = useState<Record<string, string>>({});

  const frag = useMemo(() => {
    const frags = onOrder.map((key) => shaders.find((s) => s.key === key)?.frag ?? PASSTHROUGH_FRAG);
    return frags.length > 0 ? frags : PASSTHROUGH_FRAG;
  }, [onOrder, shaders]);

  const getShader = (key: string) => shaders.find((s) => s.key === key);

  const getEditorCode = (key: string) =>
    key in draftCode ? draftCode[key] : (getShader(key)?.frag ?? "");

  const getEditorName = (key: string) =>
    key in draftName ? draftName[key] : (getShader(key)?.label ?? "");

  const isDirty = (key: string) => {
    const s = getShader(key);
    if (!s) return false;
    const codeDirty = key in draftCode && draftCode[key] !== s.frag;
    const nameDirty = key in draftName && draftName[key] !== s.label;
    return codeDirty || nameDirty;
  };

  const openPanel = (key: string) => {
    setSelectedKey(key);
    setPanelOpen(true);
  };

  const handleSave = () => {
    if (!selectedKey) return;
    const s = getShader(selectedKey);
    if (!s) return;
    const newFrag  = selectedKey in draftCode ? draftCode[selectedKey] : s.frag;
    const newLabel = selectedKey in draftName ? draftName[selectedKey] : s.label;
    setShaders((prev) =>
      prev.map((x) => x.key === selectedKey ? { ...x, frag: newFrag, label: newLabel } : x)
    );
    setDraftCode((prev) => { const n = { ...prev }; delete n[selectedKey]; return n; });
    setDraftName((prev) => { const n = { ...prev }; delete n[selectedKey]; return n; });
  };

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const handleAddShader = () => {
    const key = `custom-${Date.now()}`;
    setShaders((prev) => [...prev, { key, label: "Untitled", frag: PASSTHROUGH_FRAG }]);
    setOffOrder((prev) => [...prev, key]);
    openPanel(key);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    shaders, onOrder, offOrder, setOnOrder, setOffOrder, frag,
    selectedKey, panelOpen, setPanelOpen, draftCode, draftName, setDraftCode, setDraftName,
    openPanel, handleSave, handleAddShader,
    getShader, getEditorCode, getEditorName, isDirty,
  };
}
