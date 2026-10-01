import { isLatinLetter, toGujarati } from "./transliterate";

/**
 * Make an <input> or <textarea> type Gujarati from Latin keys.
 *
 * Works at the DOM level, so the same code serves a plain TextField and a MUI
 * Autocomplete: the converted text is written through the element's native
 * value setter and announced with an `input` event, which React and MUI handle
 * exactly as if it had been typed.
 *
 * Two paths, because keyboards differ:
 *  - Desktop and iOS send one `beforeinput` per letter. The Latin letters of
 *    the word being typed are kept in a buffer and the whole word is
 *    re-rendered on every key, so "k" → ક then "kh" → ખ, and Backspace removes
 *    the last Latin letter rather than a Gujarati sign.
 *  - Android keyboards compose a word before committing it, and changing the
 *    text mid-composition breaks them. There the word is converted once, when
 *    the composition ends.
 *
 * @param {HTMLInputElement|HTMLTextAreaElement} element
 * @param {() => boolean} isActive  read at each keystroke, so toggling needs no re-attach
 * @returns {() => void} detach
 */
const attachTransliteration = (element, isActive) => {
  if (!element) return () => {};

  /** The word currently being typed: where its rendering starts, and its Latin source. */
  let buffer = null; // { start, latin, rendered }
  let compositionStart = null;

  const setValue = (value, caret) => {
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element),
      "value"
    ).set;
    setter.call(element, value);
    element.setSelectionRange(caret, caret);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  };

  /** Is the buffer still describing the text right before the caret? */
  const bufferIsLive = (caret) =>
    buffer &&
    caret === buffer.start + buffer.rendered.length &&
    element.value.slice(buffer.start, caret) === buffer.rendered;

  const onBeforeInput = (event) => {
    if (!isActive()) {
      buffer = null;
      return;
    }
    // Android composition is handled on compositionend instead.
    if (event.isComposing || String(event.inputType).includes("Composition")) {
      return;
    }

    const { selectionStart: caret, selectionEnd } = element;
    const collapsed = caret === selectionEnd;

    if (event.inputType === "insertText" && isLatinLetter(event.data) && collapsed) {
      event.preventDefault();
      if (!bufferIsLive(caret)) buffer = { start: caret, latin: "", rendered: "" };

      const before = element.value.slice(0, buffer.start);
      const after = element.value.slice(buffer.start + buffer.rendered.length);
      buffer.latin += event.data;
      buffer.rendered = toGujarati(buffer.latin);
      setValue(before + buffer.rendered + after, buffer.start + buffer.rendered.length);
      return;
    }

    if (event.inputType === "deleteContentBackward" && collapsed && bufferIsLive(caret)) {
      event.preventDefault();
      const before = element.value.slice(0, buffer.start);
      const after = element.value.slice(caret);
      buffer.latin = buffer.latin.slice(0, -1);
      buffer.rendered = toGujarati(buffer.latin);
      const caretAfter = buffer.start + buffer.rendered.length;
      if (!buffer.latin) buffer = null;
      setValue(before + (buffer ? buffer.rendered : "") + after, caretAfter);
      return;
    }

    // Anything else — space, digits, punctuation, paste — ends the word.
    buffer = null;
  };

  const onCompositionStart = () => {
    compositionStart = element.selectionStart;
  };

  const onCompositionEnd = (event) => {
    const start = compositionStart;
    compositionStart = null;
    buffer = null;
    if (!isActive() || start === null) return;

    const word = event.data || "";
    // Only a composed run of Latin letters is ours to convert.
    if (!/^[A-Za-z]+$/.test(word)) return;

    // Let the browser finish writing the composed text first.
    setTimeout(() => {
      const value = element.value;
      if (value.slice(start, start + word.length) !== word) return;
      const rendered = toGujarati(word);
      const caret = element.selectionStart;
      const shift = rendered.length - word.length;
      setValue(
        value.slice(0, start) + rendered + value.slice(start + word.length),
        caret >= start + word.length ? caret + shift : start + rendered.length
      );
    }, 0);
  };

  /** Moving away from the word means the next letter starts a new one. */
  const reset = () => {
    buffer = null;
  };

  element.addEventListener("beforeinput", onBeforeInput);
  element.addEventListener("compositionstart", onCompositionStart);
  element.addEventListener("compositionend", onCompositionEnd);
  element.addEventListener("blur", reset);

  return () => {
    element.removeEventListener("beforeinput", onBeforeInput);
    element.removeEventListener("compositionstart", onCompositionStart);
    element.removeEventListener("compositionend", onCompositionEnd);
    element.removeEventListener("blur", reset);
  };
};

export default attachTransliteration;
