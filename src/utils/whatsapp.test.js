import i18n from "../i18n/i18n";
import {
  billMessage,
  openWhatsApp,
  reminderMessage,
  toWhatsAppNumber,
  whatsAppUrl,
} from "./whatsapp";

const t = (key, params) => i18n.t(key, params);

const settings = {
  shopName: "Devangi Tobacco",
  currencySymbol: "₹",
  receiptFooter: "Thank you! Visit again!",
};

/** Potato 2 Kg + Chilli 250 g, ₹2 off, 18% GST, ₹50 paid of ₹82.60. */
const order = {
  id: "o7",
  invoiceNo: "DT_7",
  billingDate: "2026-10-07T10:00:00.000Z",
  customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
  order: [
    { id: "p1", itemName: "Potato", price: "11", itemQuantity: "2", quantityCategory: "Kg" },
    { id: "p2", itemName: "Chilli", price: "200", itemQuantity: "250", quantityCategory: "Grams" },
  ],
  subtotal: 72,
  discountAmount: 2,
  GST: "yes",
  GSTRate: 18,
  GSTAmount: 12.6,
  total: "82.60",
  payment: "Cash",
  amountPaid: 50,
  balanceDue: 32.6,
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterAll(async () => {
  await i18n.changeLanguage("en");
});

describe("toWhatsAppNumber", () => {
  it.each([
    ["9876543210", "919876543210"],
    ["98765 43210", "919876543210"],
    ["+91 98765-43210", "919876543210"],
    ["09876543210", "919876543210"],
    ["0091 9876543210", "919876543210"],
    ["919876543210", "919876543210"],
    ["+1 415 555 0100", "14155550100"],
  ])("%s → %s", (input, expected) => {
    expect(toWhatsAppNumber(input)).toBe(expected);
  });

  it("gives nothing back for what is not a phone number", () => {
    expect(toWhatsAppNumber("")).toBe("");
    expect(toWhatsAppNumber(undefined)).toBe("");
    expect(toWhatsAppNumber("12345")).toBe("");
  });
});

describe("whatsAppUrl", () => {
  it("addresses the customer and carries the text", () => {
    expect(whatsAppUrl("9876543210", "Hi & bye")).toBe(
      "https://wa.me/919876543210?text=Hi%20%26%20bye"
    );
  });

  it("lets WhatsApp ask who to send to when there is no number", () => {
    expect(whatsAppUrl("", "Hi")).toBe("https://wa.me/?text=Hi");
  });
});

describe("openWhatsApp", () => {
  it("opens WhatsApp in a new tab without handing it this window", () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    openWhatsApp("9876543210", "Hello");
    expect(open).toHaveBeenCalledWith(
      "https://wa.me/919876543210?text=Hello",
      "_blank",
      "noopener,noreferrer"
    );
    open.mockRestore();
  });
});

describe("billMessage", () => {
  it("reads like the receipt: shop, bill, customer, lines and totals", () => {
    const lines = billMessage(order, { t, settings }).split("\n");

    expect(lines[0]).toBe("*Devangi Tobacco*");
    expect(lines[1]).toBe("Bill DT_7 · 07/10/2026");
    expect(lines[2]).toBe("Customer: Jay");
    expect(lines).toContain("1. Potato · 2 Kg · ₹22.00");
    // Grams are priced per Kg: 250 g of ₹200/Kg chilli is ₹50.
    expect(lines).toContain("2. Chilli · 250 Grams · ₹50.00");
    expect(lines).toContain("Subtotal: ₹72.00");
    expect(lines).toContain("Discount Applied: −₹2.00");
    expect(lines).toContain("GST Amount (18%): ₹12.60");
    expect(lines).toContain("*Total Price: ₹82.60*");
    expect(lines).toContain("Amount Paid: ₹50.00");
    expect(lines).toContain("*Balance Due: ₹32.60*");
    expect(lines[lines.length - 1]).toBe("Thank you! Visit again!");
  });

  it("leaves out lines that would only say zero", () => {
    const paid = {
      ...order,
      subtotal: 72,
      discountAmount: 0,
      GSTAmount: 0,
      total: "72.00",
      amountPaid: 72,
      balanceDue: 0,
    };
    const text = billMessage(paid, { t, settings });

    expect(text).toContain("*Total Price: ₹72.00*");
    expect(text).not.toContain("Subtotal");
    expect(text).not.toContain("Discount");
    expect(text).not.toContain("GST");
    expect(text).not.toContain("Balance Due");
  });

  it("counts an old Pending bill with no balance field as owed in full", () => {
    const legacy = { ...order, payment: "Pending", amountPaid: undefined, balanceDue: undefined };
    expect(billMessage(legacy, { t, settings })).toContain("*Balance Due: ₹82.60*");
  });

  it("is written in Gujarati when the app is", async () => {
    await i18n.changeLanguage("gu");
    const text = billMessage(order, { t, settings });
    expect(text).toContain("બિલ DT_7");
    expect(text).toContain("ગ્રાહક: Jay");
    expect(text).toContain("*કુલ કિંમત: ₹82.60*");
  });
});

describe("reminderMessage", () => {
  it("names the customer, the amount, the bills and the shop", () => {
    expect(
      reminderMessage({ name: "Jay", amount: 1250, count: 2 }, { t, settings })
    ).toBe(
      "Namaste Jay, a gentle reminder from Devangi Tobacco: ₹1250.00 is pending on 2 bill(s). Please pay when convenient. Thank you!"
    );
  });

  it("still reads politely without a name or a shop name", () => {
    const text = reminderMessage({ name: "—", amount: 10, count: 1 }, { t, settings: {} });
    expect(text).toMatch(/^Namaste ji, a gentle reminder from our shop: ₹10\.00/);
  });

  it("is written in Gujarati when the app is", async () => {
    await i18n.changeLanguage("gu");
    expect(
      reminderMessage({ name: "જય", amount: 500, count: 1 }, { t, settings })
    ).toContain("નમસ્તે જય");
  });
});
