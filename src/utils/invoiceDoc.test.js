import i18n from "../i18n/i18n";
import { buildInvoiceDoc, guardShaping } from "./invoiceDoc";

const settings = {
  shopName: "Devangi Tobacco",
  shopAddress: "Sudama Chowk, Surat",
  shopPhone: "98250 12345",
  shopGSTIN: "24ABCDE1234F1Z5",
  gstRate: 18,
  currencySymbol: "₹",
  receiptFooter: "Thank you! Visit again!",
  billPaper: "A4",
};

/** A credit bill with GST, a discount, HSN codes and a grams line. */
const bill = {
  invoiceNo: "DT_7",
  billingDate: "2026-10-05T05:29:00.000Z",
  customerInfo: { vendorName: "Jay Patel", vendorPhone: "9876543100", address: "Bhavani circle" },
  GSTNumber: "24PQRST6789K1Z2",
  order: [
    { id: "1", itemName: "Banana", price: "100", quantityCategory: "Pcs.", itemQuantity: "3", subtotal: "300.00", hsn: "0803" },
    { id: "2", itemName: "Orange", price: "50", quantityCategory: "Kg", itemQuantity: "2", subtotal: "100.00", hsn: "0805" },
    { id: "3", itemName: "Chilli", price: "20", quantityCategory: "Grams", itemQuantity: "500", subtotal: "10.00", hsn: "0904" },
    { id: "4", itemName: "Dhana dal", price: "10", quantityCategory: "Kg", itemQuantity: "5", subtotal: "50.00", hsn: "0909" },
  ],
  subtotal: 460,
  discountAmount: 10,
  GST: "yes",
  GSTRate: 18,
  GSTAmount: 81,
  total: "531.00",
  payment: "Pending",
  amountPaid: 200,
  changeDue: 0,
  balanceDue: 331,
};

/** A cash bill without GST, discount or HSN. */
const cashBill = {
  invoiceNo: "DT_8",
  billingDate: "2026-10-08T09:15:00.000Z",
  customerInfo: { vendorName: "Abhi" },
  order: [
    { id: "1", itemName: "Blue Berry", price: "120", quantityCategory: "Pcs.", itemQuantity: "1", subtotal: "120.00" },
  ],
  subtotal: 120,
  GST: "no",
  GSTAmount: 0,
  total: "120.00",
  payment: "Cash",
  amountPaid: 120,
  balanceDue: 0,
};

const build = (target, { lang = "en", ...extra } = {}, options = {}) =>
  buildInvoiceDoc(target, {
    settings: { ...settings, ...extra },
    t: i18n.getFixedT(lang),
    lang,
    ...options,
  });

/** Every text in a pdfmake document, in reading order. */
const texts = (node) => {
  if (Array.isArray(node)) return node.flatMap(texts);
  if (typeof node === "string") return [node];
  if (!node || typeof node !== "object") return [];
  return [
    ...(typeof node.text === "string" ? [node.text] : texts(node.text ?? [])),
    ...["content", "stack", "columns"].flatMap((key) => texts(node[key] ?? [])),
    ...(node.table ? texts(node.table.body) : []),
  ];
};

/** The items table: the one table with a repeating header row. */
const itemsTable = (doc) => doc.content.find((block) => block.table?.headerRows === 1).table;

const rowTexts = (row) => row.map((cell) => (typeof cell === "string" ? cell : cell.text));

describe("bill-book tax invoice", () => {
  it("carries the shop, the buyer and the bill like a printed bill book", () => {
    const doc = build(bill);
    const all = texts(doc);

    expect(doc.pageSize).toBe("A4");
    expect(all).toEqual(
      expect.arrayContaining([
        "GSTIN: 24ABCDE1234F1Z5",
        "TAX INVOICE",
        "Mo. 98250 12345",
        "DEVANGI TOBACCO",
        "Sudama Chowk, Surat",
        "State Code",
        "24",
        "Name & Address",
        "Jay Patel",
        "Mo. 9876543100",
        "Bhavani circle",
        "GSTIN: 24PQRST6789K1Z2",
        "State Code: 24",
        "DT_7",
        "05/10/2026",
        "Pending",
      ])
    );
  });

  it("lists every line with its HSN, quantity, rate and amount", () => {
    const table = itemsTable(build(bill));

    expect(rowTexts(table.body[0])).toEqual(["S.No.", "Description of Goods", "Qty", "HSN", "Rate", "Amount"]);
    expect(rowTexts(table.body[1])).toEqual(["1", "Banana", "3 Pcs.", "0803", "100.00", "300.00"]);
    // A grams line is priced per Kg, and says so.
    expect(rowTexts(table.body[3])).toEqual(["3", "Chilli", "500 Grams", "0904", "20.00/Kg", "10.00"]);
  });

  it("splits GST into CGST and SGST and writes the total in words", () => {
    const all = texts(build(bill));

    expect(all).toEqual(
      expect.arrayContaining([
        "Total", "₹460.00",
        "Discount", "− ₹10.00",
        "Taxable Amount", "₹450.00",
        "CGST @ 9%", "SGST @ 9%", "₹40.50",
        "GRAND TOTAL", "₹531.00",
        "Paid", "₹200.00",
        "Balance Due", "₹331.00",
        "Rupees Five Hundred Thirty One Only",
        "Total items: 4",
      ])
    );
    expect(all).not.toContain("IGST @ 18%");
  });

  it("uses IGST for a buyer in another state", () => {
    const all = texts(build({ ...bill, GSTNumber: "27PQRST6789K1Z2" }));
    expect(all).toEqual(expect.arrayContaining(["IGST @ 18%", "₹81.00", "State Code: 27"]));
    expect(all).not.toContain("CGST @ 9%");
  });

  it("ends with the declaration, both signatures and the shop's note", () => {
    const all = texts(build(bill));
    expect(all).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^We declare that this invoice shows the actual price/),
        "Customer's Sign.",
        "For Devangi Tobacco",
        "Auth. Signatory",
        "Thank you! Visit again!",
      ])
    );
  });

  it("has no title without GST, no HSN column and no repeated total", () => {
    const doc = build(cashBill);
    const all = texts(doc);

    expect(all).not.toContain("TAX INVOICE");
    expect(all).not.toContain("INVOICE");
    expect(rowTexts(itemsTable(doc).body[0])).toEqual(["S.No.", "Description of Goods", "Qty", "Rate", "Amount"]);
    expect(all).not.toContain("Total");
    expect(all).toEqual(expect.arrayContaining(["GRAND TOTAL", "₹120.00", "Rupees One Hundred Twenty Only"]));
    expect(all).not.toContain("Balance Due");
  });

  it("leaves out the top line and the address line when they would be empty", () => {
    const bare = { ...settings, shopGSTIN: "", shopPhone: "", shopAddress: "" };
    const header = (doc) => doc.content[0].table.body;

    // No GST, no GSTIN, no mobile: the box starts with the shop's name.
    const plain = build(cashBill, bare);
    expect(header(plain)).toHaveLength(1);
    expect(header(plain)[0][0].stack).toHaveLength(1);
    expect(texts(header(plain))).toEqual(["DEVANGI TOBACCO"]);

    // A GST bill still says TAX INVOICE, even with nothing either side of it.
    expect(texts(header(build(bill, bare))[0])).toContain("TAX INVOICE");
  });

  it("prints in Gujarati when the bill language is Gujarati", () => {
    const all = texts(build(bill, { lang: "gu" }));
    expect(all).toEqual(
      expect.arrayContaining(["ટેક્સ ઇન્વોઇસ", "બિલ નં.", "કુલ રકમ", "બાકી", "રૂપિયા પાંચસો એકત્રીસ પૂરા", "Devangi Tobacco વતી"])
    );
  });

  it("uses the smaller page for A5", () => {
    expect(build(bill, { billPaper: "A5" }).pageSize).toBe("A5");
  });
});

describe("filling the page", () => {
  /** A stand-in for pdfmake: 25 rows of the items table fit on a page. */
  const fitsPerPage = 25;
  const countPages = (doc) => Math.ceil(itemsTable(doc).body.length / fitsPerPage);

  it("adds blank ruled rows until the page is full, and no further", () => {
    const table = itemsTable(build(bill, {}, { countPages }));
    expect(table.body).toHaveLength(fitsPerPage);
    expect(rowTexts(table.body[fitsPerPage - 1])).toEqual([" ", " ", " ", " ", " ", " "]);
  });

  it("fills the last page of a bill already longer than one", () => {
    const long = {
      ...bill,
      order: Array.from({ length: 30 }, (_, i) => ({ ...bill.order[0], id: String(i) })),
    };
    expect(itemsTable(build(long, {}, { countPages })).body).toHaveLength(fitsPerPage * 2);
  });

  it("adds only a few blank rows when the page cannot be measured", () => {
    expect(itemsTable(build(bill)).body).toHaveLength(1 + bill.order.length + 4);
  });
});

describe("thermal receipt", () => {
  it("keeps the narrow till receipt, in the chosen language", () => {
    const doc = build(bill, { billPaper: "thermal", lang: "gu" });
    expect(doc.pageSize).toEqual({ width: 230, height: "auto" });
    expect(texts(doc)).toEqual(expect.arrayContaining(["બિલ નં.: DT_7", "કુલ રકમ", "₹531.00", "પેમેન્ટ: બાકી"]));
  });
});

describe("text that would crash the PDF font engine", () => {
  const marksOff = { abvm: false, blwm: false, mark: false, mkmk: false };

  it("lays out a nasal on a stand-alone vowel with mark positioning off", () => {
    const doc = build({ ...cashBill, customerInfo: { vendorName: "અંકિત", address: "આંબાવાડી" } });
    const nodes = doc.content.flatMap(function collect(node) {
      if (Array.isArray(node)) return node.flatMap(collect);
      if (!node || typeof node !== "object") return [];
      return [node, ...["content", "stack", "columns"].flatMap((k) => collect(node[k] ?? [])), ...(node.table ? collect(node.table.body) : [])];
    });

    expect(nodes.find((node) => node.text === "અંકિત").fontFeatures).toEqual(marksOff);
    expect(nodes.find((node) => node.text === "આંબાવાડી").fontFeatures).toEqual(marksOff);
    // Ordinary text keeps full shaping.
    expect(nodes.find((node) => node.text === "DEVANGI TOBACCO").fontFeatures).toBeUndefined();
  });

  it("guards a sign typed after a vowel, and plain strings in tables", () => {
    expect(guardShaping("અેક")).toEqual({ text: "અેક", fontFeatures: marksOff });
    expect(guardShaping({ table: { body: [["ધાણાદાળ", "અેક"]] } }).table.body[0]).toEqual([
      "ધાણાદાળ",
      { text: "અેક", fontFeatures: marksOff },
    ]);
  });

  it("leaves well-formed Gujarati alone", () => {
    expect(guardShaping({ text: "દેવાંગી ટોબેકો" })).toEqual({ text: "દેવાંગી ટોબેકો" });
  });
});
