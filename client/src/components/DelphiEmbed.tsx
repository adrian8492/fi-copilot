/**
 * DelphiEmbed.tsx
 *
 * "Ask Adrian" — Delphi AI Clone Integration
 *
 * Features:
 *  - Floating action button (bottom-right) always visible
 *  - Slide-out panel from right side with Delphi iframe
 *  - URL from env var: DELPHI_EMBED_URL (exposed via VITE_DELPHI_EMBED_URL)
 *  - Dark theme, matches app design
 *  - Keyboard shortcut: Escape to close
 */

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, X, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

// Fallback to a placeholder if env var not set
const DELPHI_EMBED_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_DELPHI_EMBED_URL as string | undefined) ||
  "https://delphi.ai/adriananania/embed";

// ─── Panel Component ──────────────────────────────────────────────────────────

interface DelphiPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function DelphiPanel({ isOpen, onClose }: DelphiPanelProps) {
  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop (mobile only, translucent) */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 sm:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 z-50 flex flex-col",
          "w-full sm:w-[420px] lg:w-[480px]",
          "bg-[#0f1117] border-l border-[#1e2433]",
          "shadow-2xl shadow-black/60",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Ask Adrian — Delphi AI"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2433] bg-[#0d1018] shrink-0">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-bold text-sm">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">Ask Adrian</p>
            <p className="text-[11px] text-slate-400">F&I Expert · ASURA Group</p>
          </div>
          <div className="flex items-center gap-1">
            <a
              href={DELPHI_EMBED_URL.replace("/embed", "")}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 relative overflow-hidden">
          {isOpen && (
            <iframe
              src={DELPHI_EMBED_URL}
              title="Ask Adrian — Delphi AI Clone"
              className="absolute inset-0 w-full h-full border-0"
              allow="microphone; camera"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1e2433] bg-[#0d1018] shrink-0">
          <p className="text-[10px] text-slate-500 text-center">
            Powered by Delphi · Adrian Anania, 16 years F&I · ASURA Group
          </p>
        </div>
      </div>
    </>
  );
}

// ─── Floating Action Button ───────────────────────────────────────────────────

interface DelphiEmbedProps {
  /** Override the bottom offset to avoid overlapping other FABs */
  bottomOffset?: number;
}

export function DelphiEmbed({ bottomOffset = 24 }: DelphiEmbedProps) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Prevent body scroll when panel open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  void open; // suppress unused warning — available for programmatic open

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        className={cn(
          "fixed right-6 z-40",
          "flex items-center gap-2.5",
          "px-4 py-3 rounded-full",
          "bg-gradient-to-r from-blue-600 to-purple-600",
          "text-white font-semibold text-sm",
          "shadow-lg shadow-blue-900/40",
          "hover:from-blue-500 hover:to-purple-500",
          "hover:shadow-xl hover:shadow-blue-800/50",
          "active:scale-95",
          "transition-all duration-200",
          "border border-white/10",
          // When panel open, show close icon variant
          isOpen && "from-slate-700 to-slate-700 border-slate-600 shadow-slate-900/40"
        )}
        style={{ bottom: bottomOffset }}
        aria-label={isOpen ? "Close Ask Adrian" : "Ask Adrian"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <>
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">Close</span>
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4" />
            <span>Ask Adrian</span>
          </>
        )}
      </button>

      {/* Panel */}
      <DelphiPanel isOpen={isOpen} onClose={close} />
    </>
  );
}

export default DelphiEmbed;
