import en from "./locals/en.json";
import gu from "./locals/gu.json";

/** Every key path in a nested translation object, e.g. "buttonText.save". */
const keys = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`]
  );

/**
 * A key missing from one language does not error — the app quietly shows the
 * English text instead — so the two files are checked against each other.
 */
describe("translation files", () => {
  it("Gujarati has every English key", () => {
    const missing = keys(en).filter((key) => !keys(gu).includes(key));
    expect(missing).toEqual([]);
  });

  it("English has every Gujarati key", () => {
    const missing = keys(gu).filter((key) => !keys(en).includes(key));
    expect(missing).toEqual([]);
  });

  it("has no empty translations", () => {
    const empty = [...keys(en).map((k) => ["en", k]), ...keys(gu).map((k) => ["gu", k])]
      .filter(([lang, key]) => {
        const value = key.split(".").reduce((node, part) => node?.[part], lang === "en" ? en : gu);
        return typeof value !== "string" || value.trim() === "";
      });
    expect(empty).toEqual([]);
  });
});
