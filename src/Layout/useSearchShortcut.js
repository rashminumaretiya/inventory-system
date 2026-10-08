import { useEffect } from "react";

/** The cursor is in a field: "/" belongs to what is being typed there. */
const isTypingIn = (target) =>
  Boolean(target) &&
  (target.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || ""));

/**
 * Ctrl+K (⌘K on a Mac) opens Quick Search from anywhere, and so does "/"
 * when the cursor is not in a field — the keys most web apps have taught.
 * `onOpen` should be stable (useCallback).
 */
const useSearchShortcut = (onOpen) => {
  useEffect(() => {
    const handler = (event) => {
      const key = String(event.key || "").toLowerCase();
      const withModifier = event.ctrlKey || event.metaKey;
      if (withModifier && key === "k") {
        event.preventDefault();
        onOpen();
      } else if (
        key === "/" &&
        !withModifier &&
        !event.altKey &&
        !isTypingIn(event.target)
      ) {
        event.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpen]);
};

export default useSearchShortcut;
