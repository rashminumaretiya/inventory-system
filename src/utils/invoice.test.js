import { amountInWords, gstStateCode, splitGst } from "./invoice";

describe("gstStateCode", () => {
  it("reads the state from the start of a GSTIN", () => {
    expect(gstStateCode("24ABCDE1234F1Z5")).toBe("24");
    expect(gstStateCode(" 27aaaca1234a1z9 ")).toBe("27");
  });

  it("gives nothing for what is not a GSTIN", () => {
    expect(gstStateCode("")).toBe("");
    expect(gstStateCode(undefined)).toBe("");
    expect(gstStateCode("9876543210")).toBe("");
  });
});

describe("splitGst", () => {
  it("splits GST into CGST and SGST within a state", () => {
    expect(
      splitGst({ gstAmount: 72, gstRate: 18, sellerGSTIN: "24ABCDE1234F1Z5", buyerGSTIN: "24PQRST6789K1Z2" })
    ).toEqual([
      { key: "cgst", rate: 9, amount: 36 },
      { key: "sgst", rate: 9, amount: 36 },
    ]);
  });

  it("treats a bill without a buyer GSTIN as within the state", () => {
    expect(splitGst({ gstAmount: 10, gstRate: 5, sellerGSTIN: "24ABCDE1234F1Z5" })).toEqual([
      { key: "cgst", rate: 2.5, amount: 5 },
      { key: "sgst", rate: 2.5, amount: 5 },
    ]);
  });

  it("keeps the halves adding up to the whole when the paise are odd", () => {
    const [cgst, sgst] = splitGst({ gstAmount: 12.61, gstRate: 18 });
    expect(cgst.amount + sgst.amount).toBeCloseTo(12.61, 10);
  });

  it("uses IGST when the buyer is in another state", () => {
    expect(
      splitGst({ gstAmount: 72, gstRate: 18, sellerGSTIN: "24ABCDE1234F1Z5", buyerGSTIN: "27PQRST6789K1Z2" })
    ).toEqual([{ key: "igst", rate: 18, amount: 72 }]);
  });
});

describe("amountInWords in English", () => {
  it.each([
    [0, "Rupees Zero Only"],
    [7, "Rupees Seven Only"],
    [15, "Rupees Fifteen Only"],
    [20, "Rupees Twenty Only"],
    [99, "Rupees Ninety Nine Only"],
    [100, "Rupees One Hundred Only"],
    [472, "Rupees Four Hundred Seventy Two Only"],
    [1000, "Rupees One Thousand Only"],
    [1234, "Rupees One Thousand Two Hundred Thirty Four Only"],
    [99999, "Rupees Ninety Nine Thousand Nine Hundred Ninety Nine Only"],
    [100000, "Rupees One Lakh Only"],
    [1234567, "Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven Only"],
    [10000000, "Rupees One Crore Only"],
    [1250000000, "Rupees One Hundred Twenty Five Crore Only"],
  ])("%s → %s", (value, words) => {
    expect(amountInWords(value, "en")).toBe(words);
  });

  it("adds the paise", () => {
    expect(amountInWords(82.6, "en")).toBe("Rupees Eighty Two and Sixty Paise Only");
    expect(amountInWords("1.05", "en")).toBe("Rupees One and Five Paise Only");
  });
});

describe("amountInWords in Gujarati", () => {
  it.each([
    [472, "રૂપિયા ચારસો બોતેર પૂરા"],
    [100, "રૂપિયા એકસો પૂરા"],
    [200, "રૂપિયા બસો પૂરા"],
    [1234, "રૂપિયા એક હજાર બસો ચોત્રીસ પૂરા"],
    [2050, "રૂપિયા બે હજાર પચાસ પૂરા"],
    [100000, "રૂપિયા એક લાખ પૂરા"],
    [1599999, "રૂપિયા પંદર લાખ નવ્વાણું હજાર નવસો નવ્વાણું પૂરા"],
    [20000000, "રૂપિયા બે કરોડ પૂરા"],
  ])("%s → %s", (value, words) => {
    expect(amountInWords(value, "gu")).toBe(words);
  });

  it("adds the paise", () => {
    expect(amountInWords(82.6, "gu")).toBe("રૂપિયા બ્યાસી અને સાઠ પૈસા પૂરા");
  });
});
