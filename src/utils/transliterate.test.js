import {
  containsGujarati,
  textMatches,
  toGujarati,
} from "./transliterate";

describe("toGujarati: names and goods a shop types", () => {
  it.each([
    ["ramesh", "રમેશ"],
    ["bhaavin", "ભાવિન"],
    ["shree", "શ્રી"],
    ["raam", "રામ"],
    ["sita", "સિત"],
    ["pooja", "પૂજ"],
    ["priya", "પ્રિય"],
    ["krishna", "ક્રિશ્ન"],
    ["laxmi", "લક્ષ્મિ"],
    ["kheti", "ખેતિ"],
    ["ghee", "ઘી"],
    ["chaa", "ચા"],
    ["chhaas", "છાસ"],
    ["jhaaDu", "ઝાડુ"],
    ["dhaaNaadaaL", "ધાણાદાળ"],
    ["gaay", "ગાય"],
    ["phool", "ફૂલ"],
    ["sabun", "સબુન"],
    ["mayur", "મયુર"],
    ["vijay", "વિજય"],
  ])("%s → %s", (latin, gujarati) => {
    expect(toGujarati(latin)).toBe(gujarati);
  });
});

describe("toGujarati: vowels", () => {
  it("writes a vowel on its own at the start of a word", () => {
    expect(toGujarati("amit")).toBe("અમિત");
    expect(toGujarati("aaj")).toBe("આજ");
    expect(toGujarati("ishaan")).toBe("ઇશાન");
    expect(toGujarati("oon")).toBe("ઊન");
    expect(toGujarati("ek")).toBe("એક");
  });

  it("writes a vowel sign after a consonant", () => {
    expect(toGujarati("ki")).toBe("કિ");
    expect(toGujarati("kii")).toBe("કી");
    expect(toGujarati("ku")).toBe("કુ");
    expect(toGujarati("koo")).toBe("કૂ");
    expect(toGujarati("ke")).toBe("કે");
    expect(toGujarati("kai")).toBe("કૈ");
    expect(toGujarati("ko")).toBe("કો");
    expect(toGujarati("kau")).toBe("કૌ");
  });

  it("leaves the inherent a unwritten", () => {
    expect(toGujarati("ka")).toBe("ક");
    expect(toGujarati("kam")).toBe("કમ");
  });
});

describe("toGujarati: consonant clusters", () => {
  it("joins consonants written together", () => {
    expect(toGujarati("pr")).toBe("પ્ર");
    expect(toGujarati("tra")).toBe("ત્ર");
    expect(toGujarati("anna")).toBe("અન્ન");
  });

  it("has the special conjuncts", () => {
    expect(toGujarati("ksh")).toBe("ક્ષ");
    expect(toGujarati("x")).toBe("ક્ષ");
    expect(toGujarati("jnaan")).toBe("જ્ઞાન");
  });
});

describe("toGujarati: nasal sounds", () => {
  it("turns n before a matching consonant into an anusvara", () => {
    expect(toGujarati("santosh")).toBe("સંતોશ");
    expect(toGujarati("chaand")).toBe("ચાંદ");
    expect(toGujarati("ankit")).toBe("અંકિત");
    expect(toGujarati("rang")).toBe("રંગ");
  });

  it("turns m before a labial into an anusvara", () => {
    expect(toGujarati("sampurn")).toBe("સંપુર્ન");
  });

  it("keeps n at the start of a word as a letter", () => {
    expect(toGujarati("nilesh")).toBe("નિલેશ");
  });

  it("accepts M mid-word as an explicit anusvara", () => {
    expect(toGujarati("haMs")).toBe("હંસ");
  });
});

describe("toGujarati: capitals", () => {
  it("reads capital T, D, N, L and Sh mid-word as their own letters", () => {
    expect(toGujarati("paTel")).toBe("પટેલ");
    expect(toGujarati("laDDu")).toBe("લડ્ડુ");
    expect(toGujarati("kaN")).toBe("કણ");
    expect(toGujarati("kaaLu")).toBe("કાળુ");
    expect(toGujarati("kaShTa")).toBe("કષ્ટ");
  });

  it("ignores the capital a phone puts at the start of a word", () => {
    expect(toGujarati("Ramesh")).toBe("રમેશ");
    expect(toGujarati("Tushar")).toBe("તુશર");
    expect(toGujarati("Nilesh")).toBe("નિલેશ");
    expect(toGujarati("Amit")).toBe("અમિત");
    expect(toGujarati("Mahesh")).toBe("મહેશ");
  });

  it("reads other capitals as plain letters", () => {
    expect(toGujarati("raKesh")).toBe("રકેશ");
  });
});

describe("toGujarati: everything else", () => {
  it("passes spaces, digits and punctuation through", () => {
    expect(toGujarati("ramesh patel")).toBe("રમેશ પતેલ");
    expect(toGujarati("plot 12, mg road")).toBe("પ્લોત 12, મ્ગ રોઅદ");
  });

  it("leaves Gujarati already typed alone", () => {
    expect(toGujarati("રમેશ")).toBe("રમેશ");
  });

  it("copes with empty input", () => {
    expect(toGujarati("")).toBe("");
    expect(toGujarati(undefined)).toBe("");
  });
});

describe("textMatches", () => {
  it("matches ordinary text without caring about case", () => {
    expect(textMatches("Potato", "pot")).toBe(true);
    expect(textMatches("Potato", "POT")).toBe(true);
    expect(textMatches("Potato", "xyz")).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(textMatches("Potato", "")).toBe(true);
    expect(textMatches("Potato", "   ")).toBe(true);
  });

  it("finds an English name from Gujarati typed in Gujarati mode", () => {
    // "pot" in Gujarati mode becomes "પોત".
    expect(textMatches("Potato", toGujarati("pot"))).toBe(true);
    expect(textMatches("Blue Berry", toGujarati("blu"))).toBe(true);
    expect(textMatches("Potato", toGujarati("ban"))).toBe(false);
  });

  it("finds a Gujarati name from Latin typed in English mode", () => {
    expect(textMatches("ધાણાદાળ", "dhaaNaa")).toBe(true);
    expect(textMatches("રમેશ", "ramesh")).toBe(true);
    expect(textMatches("રમેશ", "bhavin")).toBe(false);
  });

  it("matches Gujarati against Gujarati directly", () => {
    expect(textMatches("ધાણાદાળ", "ધાણા")).toBe(true);
  });

  it("copes with missing text", () => {
    expect(textMatches(undefined, "a")).toBe(false);
    expect(textMatches(null, "")).toBe(true);
  });
});

describe("containsGujarati", () => {
  it("spots Gujarati script", () => {
    expect(containsGujarati("રમેશ")).toBe(true);
    expect(containsGujarati("Ramesh")).toBe(false);
    expect(containsGujarati("12")).toBe(false);
  });
});
