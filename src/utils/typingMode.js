import { useEffect, useState } from "react";

import i18n from "../i18n/i18n";

/**
 * Whether free-text fields type Gujarati.
 *
 * Only ever on while the app itself is in Gujarati. Within that, the
 * shopkeeper can flip to English (for a product sold under an English name,
 * say); the choice is remembered and applies to every field at once.
 */

const STORAGE_KEY = "typingMode"; // "gu" | "en"
const listeners = new Set();

const readMode = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "gu";
  } catch {
    return "gu";
  }
};

let mode = readMode();

const notify = () => listeners.forEach((listener) => listener());

export const isGujaratiUi = () =>
  String(i18n.language || "").toLowerCase().startsWith("gu");

/** Read on every keystroke by the input handler. */
export const isGujaratiTyping = () => isGujaratiUi() && mode !== "en";

export const setTypingMode = (next) => {
  mode = next === "en" ? "en" : "gu";
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* Storage unavailable: still switch for this session. */
  }
  notify();
};

export const toggleTypingMode = () => setTypingMode(mode === "en" ? "gu" : "en");

/** Re-read the stored mode, e.g. after tests clear storage. */
export const resetTypingMode = () => {
  mode = readMode();
  notify();
};

const snapshot = () => ({
  uiGujarati: isGujaratiUi(),
  gujaratiTyping: isGujaratiTyping(),
});

/** React view of the same state, refreshed when the app language changes too. */
export const useTypingMode = () => {
  const [state, setState] = useState(snapshot);

  useEffect(() => {
    const update = () => setState(snapshot());
    listeners.add(update);
    i18n.on("languageChanged", update);
    update();
    return () => {
      listeners.delete(update);
      i18n.off("languageChanged", update);
    };
  }, []);

  return { ...state, toggle: toggleTypingMode };
};
