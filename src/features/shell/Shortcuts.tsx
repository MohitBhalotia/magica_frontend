"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useUiStore } from "@/stores/uiStore";

/** App-wide shortcuts (DESIGN §5.3): ⌘/Ctrl+K search, Ctrl/⌘+Shift+O new task. Renders nothing. */
export function Shortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "k" && !e.shiftKey) {
        e.preventDefault();
        const { searchOpen, setSearchOpen } = useUiStore.getState();
        setSearchOpen(!searchOpen);
      } else if (key === "o" && e.shiftKey) {
        e.preventDefault();
        useUiStore.setState({ searchOpen: false, drawerOpen: false });
        router.push("/chat");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return null;
}
