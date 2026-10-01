import attachTransliteration from "./attachTransliteration";

/**
 * Simulate a browser keyboard: send `beforeinput`, and if nothing cancels it,
 * do what the browser would have done.
 */
const press = (el, key) => {
  const isBackspace = key === "Backspace";
  const event = new InputEvent("beforeinput", {
    inputType: isBackspace ? "deleteContentBackward" : "insertText",
    data: isBackspace ? null : key,
    cancelable: true,
    bubbles: true,
  });
  el.dispatchEvent(event);
  if (event.defaultPrevented) return;

  const { selectionStart: at, value } = el;
  if (isBackspace) {
    if (at === 0) return;
    el.value = value.slice(0, at - 1) + value.slice(at);
    el.setSelectionRange(at - 1, at - 1);
  } else {
    el.value = value.slice(0, at) + key + value.slice(at);
    el.setSelectionRange(at + 1, at + 1);
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

const type = (el, text) => [...text].forEach((key) => press(el, key));

let input;
let detach;
let active;
let inputEvents;

beforeEach(() => {
  input = document.createElement("input");
  input.type = "text";
  document.body.appendChild(input);
  input.focus();
  active = true;
  inputEvents = 0;
  input.addEventListener("input", () => {
    inputEvents += 1;
  });
  detach = attachTransliteration(input, () => active);
});

afterEach(() => {
  detach();
  input.remove();
});

describe("typing letter by letter", () => {
  it("turns a typed word into Gujarati", () => {
    type(input, "ramesh");
    expect(input.value).toBe("રમેશ");
  });

  it("re-reads the whole word on each key, so kh becomes ખ not કહ", () => {
    type(input, "k");
    expect(input.value).toBe("ક");
    type(input, "h");
    expect(input.value).toBe("ખ");
  });

  it("keeps the caret at the end of the word", () => {
    type(input, "raam");
    expect(input.selectionStart).toBe(input.value.length);
  });

  it("announces every change, so React and MUI see it", () => {
    type(input, "ram");
    expect(inputEvents).toBe(3);
  });

  it("starts a new word after a space", () => {
    type(input, "ramesh patel");
    expect(input.value).toBe("રમેશ પતેલ");
  });

  it("leaves digits and punctuation as typed", () => {
    type(input, "plot 12, gali 3");
    expect(input.value).toBe("પ્લોત 12, ગલિ 3");
  });
});

describe("backspace", () => {
  it("removes the last Latin letter of the word being typed", () => {
    type(input, "kh");
    expect(input.value).toBe("ખ");
    press(input, "Backspace");
    expect(input.value).toBe("ક");
  });

  it("removes a vowel sign by removing the vowel letter", () => {
    type(input, "kii");
    expect(input.value).toBe("કી");
    press(input, "Backspace");
    expect(input.value).toBe("કિ");
  });

  it("clears the word entirely, then deletes normally", () => {
    type(input, "ab ka");
    press(input, "Backspace");
    press(input, "Backspace");
    expect(input.value).toBe("અબ ");
    press(input, "Backspace");
    expect(input.value).toBe("અબ");
  });
});

describe("when switched off", () => {
  it("types Latin as normal", () => {
    active = false;
    type(input, "Blue Berry");
    expect(input.value).toBe("Blue Berry");
  });

  it("can switch mid-sentence", () => {
    type(input, "ramesh ");
    active = false;
    type(input, "Store");
    expect(input.value).toBe("રમેશ Store");
  });

  it("stops entirely once detached", () => {
    detach();
    type(input, "ram");
    expect(input.value).toBe("ram");
    detach = () => {};
  });
});

describe("Android-style word composition", () => {
  const compose = (el, word) => {
    el.dispatchEvent(new CompositionEvent("compositionstart", { data: "" }));
    const at = el.selectionStart;
    el.value = el.value.slice(0, at) + word + el.value.slice(at);
    el.setSelectionRange(at + word.length, at + word.length);
    el.dispatchEvent(new CompositionEvent("compositionend", { data: word }));
  };

  it("converts the word once the keyboard commits it", async () => {
    compose(input, "ramesh");
    // Untouched while the keyboard still owns the word.
    expect(input.value).toBe("ramesh");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(input.value).toBe("રમેશ");
  });

  it("leaves a composed word alone when switched off", async () => {
    active = false;
    compose(input, "ramesh");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(input.value).toBe("ramesh");
  });
});

it("works on a textarea too", () => {
  const area = document.createElement("textarea");
  document.body.appendChild(area);
  const off = attachTransliteration(area, () => true);
  type(area, "surat");
  expect(area.value).toBe("સુરત");
  off();
  area.remove();
});
