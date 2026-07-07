"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable (e.g. non-HTTPS) — user can copy manually */
        }
      }}
      className="rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted hover:border-fg-faint hover:text-fg"
    >
      {copied ? "✓" : "⧉"}
    </button>
  );
}
