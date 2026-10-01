/**
 * Phonetic typing for Gujarati: Latin letters in, Gujarati script out.
 *
 *   ramesh → રમેશ     chaand → ચાંદ     shree → શ્રી     laxmi → લક્ષ્મિ
 *
 * Rule-based and offline, so it works without a network and names never leave
 * the device. The rules are the common ones Indian phonetic keyboards use:
 *
 *   vowels      a aa/A i ii/ee/I u uu/oo/U e ai o au/ou   (R mid-word = ઋ matra)
 *   consonants  k kh g gh  ch chh  j jh  t th d dh n  p ph/f b bh m
 *               y r l v/w  s sh  h  z  x/ksh = ક્ષ  jn = જ્ઞ
 *   retroflex   T Th D Dh N  (capital), L = ળ, Sh = ષ
 *   nasal       n/m before a matching consonant becomes the anusvara ં
 *
 * A word's first letter is read in lowercase, because phones capitalise it
 * automatically: "Ramesh" must not become ઋમેશ, nor "Tushar" ટુષાર.
 *
 * Limits, honestly: plain rules cannot tell ત from ટ in "patel" the way a
 * dictionary-backed keyboard can; type "paTel" for પટેલ. Long vowels must be
 * typed doubled ("raam" for રામ).
 */

const VIRAMA = "્";
const ANUSVARA = "ં";
const VISARGA = "ઃ";

/** [latin, gujarati], consonants. Longer keys are matched first. */
const CONSONANTS = [
  ["ksh", "ક્ષ"],
  ["chh", "છ"],
  ["Ch", "છ"],
  ["kh", "ખ"],
  ["gh", "ઘ"],
  ["ch", "ચ"],
  ["jh", "ઝ"],
  ["jn", "જ્ઞ"],
  ["Th", "ઠ"],
  ["Dh", "ઢ"],
  ["th", "થ"],
  ["dh", "ધ"],
  ["ph", "ફ"],
  ["bh", "ભ"],
  ["Sh", "ષ"],
  ["sh", "શ"],
  ["k", "ક"],
  ["g", "ગ"],
  ["c", "ચ"],
  ["j", "જ"],
  ["T", "ટ"],
  ["D", "ડ"],
  ["N", "ણ"],
  ["t", "ત"],
  ["d", "દ"],
  ["n", "ન"],
  ["p", "પ"],
  ["f", "ફ"],
  ["b", "બ"],
  ["m", "મ"],
  ["y", "ય"],
  ["r", "ર"],
  ["l", "લ"],
  ["L", "ળ"],
  ["v", "વ"],
  ["w", "વ"],
  ["s", "સ"],
  ["h", "હ"],
  ["z", "ઝ"],
  ["x", "ક્ષ"],
  ["q", "ક"],
];

/** [latin, independent vowel, matra after a consonant]. */
const VOWELS = [
  ["aa", "આ", "ા"],
  ["ai", "ઐ", "ૈ"],
  ["au", "ઔ", "ૌ"],
  ["ou", "ઔ", "ૌ"],
  ["ii", "ઈ", "ી"],
  ["ee", "ઈ", "ી"],
  ["uu", "ઊ", "ૂ"],
  ["oo", "ઊ", "ૂ"],
  ["A", "આ", "ા"],
  ["I", "ઈ", "ી"],
  ["U", "ઊ", "ૂ"],
  ["R", "ઋ", "ૃ"],
  ["a", "અ", ""],
  ["i", "ઇ", "િ"],
  ["u", "ઉ", "ુ"],
  ["e", "એ", "ે"],
  ["o", "ઓ", "ો"],
];

/** Signs typed explicitly mid-word: M = anusvara, H = visarga. */
const SIGNS = [
  ["M", ANUSVARA],
  ["H", VISARGA],
];

/**
 * n before these becomes ં (santosh → સંતોષ, chaand → ચાંદ), and m before the
 * labials (sampurn → સંપુર્ન). A doubled nn/mm stays a conjunct (anna → અન્ન).
 */
const NASAL_BEFORE = {
  n: new Set(["k", "kh", "g", "gh", "ch", "chh", "Ch", "c", "j", "jh", "t", "th", "d", "dh", "T", "Th", "D", "Dh"]),
  m: new Set(["p", "ph", "f", "b", "bh"]),
};

const BY_LENGTH = (a, b) => b[0].length - a[0].length;
const TABLE = [
  ...CONSONANTS.map(([latin, out]) => ({ latin, kind: "consonant", out })),
  ...VOWELS.map(([latin, out, matra]) => ({ latin, kind: "vowel", out, matra })),
  ...SIGNS.map(([latin, out]) => ({ latin, kind: "sign", out })),
].sort((a, b) => BY_LENGTH([a.latin], [b.latin]));

const LATIN_LETTER = /[A-Za-z]/;

/** Split Latin text into consonant / vowel / sign / other tokens, longest match first. */
const tokenize = (text) => {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const at = i;
    // Exact case first (T vs t), then lowercase for letters with no capital meaning.
    const exact = TABLE.find((entry) => text.startsWith(entry.latin, at));
    const entry =
      exact ||
      TABLE.find(
        (candidate) =>
          candidate.latin === candidate.latin.toLowerCase() &&
          text.slice(at, at + candidate.latin.length).toLowerCase() === candidate.latin
      );

    if (entry) {
      tokens.push(entry);
      i += entry.latin.length;
    } else {
      tokens.push({ latin: text[i], kind: "other", out: text[i] });
      i += 1;
    }
  }
  return tokens;
};

/** Read each word's first letter in lowercase (phones auto-capitalise it). */
const lowerWordStarts = (text) =>
  text.replace(/(^|[^A-Za-z])([A-Z])/g, (_, before, letter) => before + letter.toLowerCase());

/** Convert Latin phonetic text to Gujarati script. Non-letters pass through. */
export const toGujarati = (text = "") => {
  const tokens = tokenize(lowerWordStarts(String(text)));
  let out = "";
  let prev = null; // "consonant" | "vowel" | "sign" | "other" | null

  tokens.forEach((token, index) => {
    const next = tokens[index + 1];

    if (token.kind === "consonant") {
      const nasal = NASAL_BEFORE[token.latin];
      if (
        nasal &&
        (prev === "consonant" || prev === "vowel") &&
        next?.kind === "consonant" &&
        nasal.has(next.latin)
      ) {
        out += ANUSVARA;
        prev = "sign";
        return;
      }
      // Two consonants in a row form a conjunct: k + r → ક્ર.
      if (prev === "consonant") out += VIRAMA;
      out += token.out;
      prev = "consonant";
      return;
    }

    if (token.kind === "vowel") {
      out += prev === "consonant" ? token.matra : token.out;
      prev = "vowel";
      return;
    }

    if (token.kind === "sign") {
      out += token.out;
      prev = "sign";
      return;
    }

    out += token.out;
    prev = "other";
  });

  return out;
};

export const containsGujarati = (text) => /[઀-૿]/.test(String(text || ""));
export const containsLatinLetter = (text) => LATIN_LETTER.test(String(text || ""));
export const isLatinLetter = (char) => typeof char === "string" && char.length === 1 && LATIN_LETTER.test(char);

/**
 * Does `text` contain `query`, across scripts?
 *
 * The product list mixes English names ("Potato") with Gujarati ones
 * ("ધાણાદાળ"). Typing "pot" in Gujarati mode produces "પોત", which must still
 * find Potato — so English text is run through the same conversion before
 * comparing, and a Latin query is converted to find Gujarati text.
 */
export const textMatches = (text, query) => {
  const typed = String(query ?? "").trim();
  const needle = typed.toLowerCase();
  if (!needle) return true;
  const haystack = String(text ?? "").toLowerCase();
  if (haystack.includes(needle)) return true;

  const queryGujarati = containsGujarati(needle);
  const textGujarati = containsGujarati(haystack);

  // Stored English names are capitalised arbitrarily, so convert them as typed
  // in lowercase — the same way a word typed in Gujarati mode starts.
  if (queryGujarati && !textGujarati) return toGujarati(haystack).includes(needle);
  // A typed query keeps its case: capital N, T, D, L mean ણ, ટ, ડ, ળ.
  if (!queryGujarati && textGujarati && containsLatinLetter(typed)) {
    return haystack.includes(toGujarati(typed));
  }
  return false;
};
