import { useState, useCallback } from "react";

/**
 * Hook for copying text to clipboard with automatic state reset.
 *
 * @param {Object} [options={}] - Options
 * @param {number} [options.timeout=2000] - Duration in ms before reset copied state
 * @returns {{ copied: boolean, copy: (text: string) => Promise<boolean> }}
 */
export function useClipboard({ timeout = 2000 } = {}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text) => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard API not available");
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (err) {
        console.warn("Copy to clipboard failed:", err);
        setCopied(false);
        return false;
      }
    },
    [timeout]
  );

  return { copied, copy };
}
