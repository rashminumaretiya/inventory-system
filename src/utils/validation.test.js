import validation from "./validation";

// Mirrors the shape of i18next's t() so messages stay assertable.
const t = (key, opts) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key;

const run = (pattern, value) => validation(pattern, value, "label", t);

describe("notEmpty", () => {
  it("rejects blank and whitespace-only values", () => {
    expect(run("notEmpty", "")).toContain("errorMsg.pleaseEnter");
    expect(run("notEmpty", undefined)).toContain("errorMsg.pleaseEnter");
    expect(run("notEmpty", "   ")).toContain("errorMsg.pleaseEnter");
  });
  it("accepts text", () => {
    expect(run("notEmpty", "Potato")).toBeUndefined();
  });
});

describe("phoneNumber", () => {
  it("accepts 10 digit Indian mobiles", () => {
    expect(run("phoneNumber", "9876543100")).toBeUndefined();
    expect(run("phoneNumber", "+91 98765 43100")).toBeUndefined();
    expect(run("phoneNumber", "6234568902")).toBeUndefined();
  });
  it("rejects wrong length or leading digit", () => {
    expect(run("phoneNumber", "1234568902")).toBe("errorMsg.validNumber");
    expect(run("phoneNumber", "98765")).toBe("errorMsg.validNumber");
    expect(run("phoneNumber", "98765431000")).toBe("errorMsg.validNumber");
  });
  it("requires a value", () => {
    expect(run("phoneNumber", "")).toContain("errorMsg.pleaseEnter");
  });
});

describe("gstin", () => {
  it("accepts a well formed GSTIN", () => {
    expect(run("gstin", "24ABCDE1234F1Z5")).toBeUndefined();
    expect(run("gstin", "24abcde1234f1z5")).toBeUndefined();
  });
  it("rejects the digits-only value the old number field allowed", () => {
    expect(run("gstin", "4322343")).toBe("errorMsg.validGSTIN");
  });
  it("treats blank as optional only for gstinOptional", () => {
    expect(run("gstin", "")).toContain("errorMsg.pleaseEnter");
    expect(run("gstinOptional", "")).toBeUndefined();
    expect(run("gstinOptional", "bad")).toBe("errorMsg.validGSTIN");
  });
});

describe("numeric patterns", () => {
  it("positiveNumber rejects zero, blanks and negatives", () => {
    expect(run("positiveNumber", "")).toContain("errorMsg.pleaseEnter");
    expect(run("positiveNumber", "0")).toContain("errorMsg.greaterThanZero");
    expect(run("positiveNumber", "-5")).toContain("errorMsg.greaterThanZero");
    expect(run("positiveNumber", "0.5")).toBeUndefined();
  });
  it("nonNegative allows zero but not negatives", () => {
    expect(run("nonNegative", "0")).toBeUndefined();
    expect(run("nonNegative", "-1")).toContain("errorMsg.notNegative");
  });
  it("percent caps at 100", () => {
    expect(run("percent", "18")).toBeUndefined();
    expect(run("percent", "101")).toBe("errorMsg.maxPercent");
  });
  it("hour accepts 0-23 integers only", () => {
    expect(run("hour", "10")).toBeUndefined();
    expect(run("hour", "24")).toBe("errorMsg.validHour");
    expect(run("hour", "10.5")).toBe("errorMsg.validHour");
  });
  it("rejects non-numeric input", () => {
    expect(run("positiveNumber", "abc")).toBe("errorMsg.validNumber");
  });
});
