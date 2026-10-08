import dayjs from "dayjs";

import {
  baseUnitOf,
  formatMoney,
  formatQuantity,
  lineSubtotal,
  num,
} from "./billing";
import { amountInWords, gstStateCode, splitGst } from "./invoice";
import { orderOutstanding } from "./payments";

/**
 * The printed bill as a pdfmake document, in one of two looks:
 *
 * - "A4" / "A5": a tax invoice laid out like an Indian bill book. GSTIN,
 *   title and mobile across the top; the shop name large; the buyer beside
 *   the bill number; a tall ruled items table; totals with CGST + SGST (or
 *   IGST); the amount in words; the declaration and both signatures.
 * - "thermal": the narrow 80 mm till receipt.
 *
 * Plain data in, plain data out: the caller passes the shop settings and a
 * translator for the bill's language, so this needs neither pdfmake nor
 * i18next and can be tested as is.
 */

const FONT = "gujarati";
const ACCENT = "#B71C1C";
const INK = "#1F2937";
const MUTED = "#4B5563";
const RULE = "#374151";
const FILL = "#F3F4F6";

/**
 * Sizes per paper, in points. `mostBlankRows` bounds the search for how many
 * blank rows fill the page (more than ever fit).
 */
const PAPER = {
  A4: {
    pageSize: "A4",
    width: 595.28,
    margin: 28,
    base: 9.5,
    small: 8.5,
    tiny: 7.5,
    name: 26,
    title: 11,
    pad: 4,
    mostBlankRows: 48,
    cols: { sno: 30, qty: 64, hsn: 56, rate: 70, amount: 80 },
  },
  A5: {
    pageSize: "A5",
    width: 419.53,
    margin: 18,
    base: 8,
    small: 7.2,
    tiny: 6.5,
    name: 19,
    title: 9.5,
    pad: 3,
    mostBlankRows: 40,
    cols: { sno: 22, qty: 50, hsn: 42, rate: 54, amount: 60 },
  },
};

/** Blank rows when the page cannot be measured: few enough never to spill. */
const FALLBACK_BLANK_ROWS = 4;

const THERMAL_WIDTH = 230;
const THERMAL_RULE = 210;

/** "9" for 9%, "2.5" for 2.5%: no trailing zeros on a rate. */
const formatRate = (rate) => String(Math.round(num(rate) * 100) / 100);

/** Price is per base unit, so a grams line reads "200.00/Kg". */
const rateText = (line) => {
  const base = baseUnitOf(line.quantityCategory);
  const price = formatMoney(line.price);
  return line.quantityCategory && line.quantityCategory !== base
    ? `${price}/${base}`
    : price;
};

/** The figures both looks print, read the same way from saved or live bills. */
const billFacts = (bill, settings) => {
  const lines = bill?.order || [];
  const lineTotal = (line) =>
    line.subtotal !== undefined && line.subtotal !== ""
      ? num(line.subtotal)
      : lineSubtotal(line);
  const when = dayjs(bill?.billingDate || undefined);

  return {
    lines,
    lineTotal,
    subtotal:
      bill?.subtotal !== undefined
        ? num(bill.subtotal)
        : lines.reduce((sum, line) => sum + lineTotal(line), 0),
    discount: num(bill?.discountAmount ?? bill?.discount),
    gst: num(bill?.GSTAmount),
    gstRate: num(bill?.GSTRate ?? settings.gstRate),
    total: num(bill?.total),
    paidRecorded: ![undefined, null, ""].includes(bill?.amountPaid),
    amountPaid: num(bill?.amountPaid),
    change: num(bill?.changeDue),
    owed: orderOutstanding(bill),
    date: when.format("DD/MM/YYYY"),
    // A date picked without a time is midnight; printing "12:00 AM" would mislead.
    time: when.hour() || when.minute() ? when.format("hh:mm A") : "",
  };
};

const paymentLabel = (payment, t) =>
  ["Cash", "Online", "Pending"].includes(payment)
    ? t(`invoice.payment${payment}`)
    : payment || "-";

/* ------------------------------------------------------------ bill book */

const bookDoc = (bill, { settings, t, lang, blankRows }) => {
  const P = PAPER[settings.billPaper] || PAPER.A4;
  const contentWidth = P.width - P.margin * 2;
  const sideWidth = Math.round(contentWidth * 0.4);
  const f = billFacts(bill, settings);
  const currency = settings.currencySymbol || "₹";
  const money = (value) => `${currency}${formatMoney(value)}`;

  const shopName = String(settings.shopName || "").trim();
  const sellerGSTIN = String(settings.shopGSTIN || "")
    .trim()
    .toUpperCase();
  const buyerGSTIN = String(bill?.GSTNumber || "")
    .trim()
    .toUpperCase();
  const sellerState = gstStateCode(sellerGSTIN);
  const buyerState = gstStateCode(buyerGSTIN);
  const customer = bill?.customerInfo || {};

  /** A box with ruled edges; `overrides` change individual rules or paddings. */
  const ruled = (overrides = {}) => ({
    hLineWidth: () => 0.8,
    vLineWidth: () => 0.8,
    hLineColor: () => RULE,
    vLineColor: () => RULE,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => P.pad,
    paddingBottom: () => P.pad,
    ...overrides,
  });
  const unruled = {
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 1,
    paddingBottom: () => 1,
  };

  // 1. GSTIN · title · mobile, then the shop's name and address. Only a GST
  //    bill carries a title ("TAX INVOICE"); a strip or line with nothing to
  //    say is left out rather than printed empty.
  const STATE_BOX = 74;
  const title = f.gst > 0 ? t("invoice.taxTitle") : "";
  const topStrip = (sellerGSTIN || title || settings.shopPhone) && [
    {
      columns: [
        {
          width: "*",
          text: sellerGSTIN ? `${t("invoice.gstin")}: ${sellerGSTIN}` : "",
          bold: true,
          fontSize: P.small,
        },
        {
          width: "auto",
          text: title,
          bold: true,
          fontSize: P.title,
          decoration: "underline",
        },
        {
          width: "*",
          text: settings.shopPhone
            ? `${t("invoice.mobile")} ${settings.shopPhone}`
            : "",
          bold: true,
          fontSize: P.small,
          alignment: "right",
        },
      ],
    },
  ];
  const header = {
    table: {
      widths: ["*"],
      body: [
        topStrip,
        [
          {
            stack: [
              {
                text: shopName.toUpperCase(),
                bold: true,
                color: ACCENT,
                fontSize: P.name,
                alignment: "center",
              },
              (settings.shopAddress || sellerState) && {
                // An empty column the width of the state box keeps the address centred.
                columns: [
                  { width: STATE_BOX, text: "" },
                  {
                    width: "*",
                    text: settings.shopAddress || "",
                    color: ACCENT,
                    fontSize: P.small,
                    alignment: "center",
                  },
                  sellerState
                    ? {
                        width: STATE_BOX,
                        table: {
                          widths: ["*", "auto"],
                          body: [
                            [
                              {
                                text: t("invoice.stateCode"),
                                fontSize: P.tiny,
                              },
                              {
                                text: sellerState,
                                bold: true,
                                fontSize: P.small,
                              },
                            ],
                          ],
                        },
                        layout: ruled({
                          paddingLeft: () => 3,
                          paddingRight: () => 3,
                          paddingTop: () => 1,
                          paddingBottom: () => 1,
                        }),
                      }
                    : { width: STATE_BOX, text: "" },
                ],
                margin: [0, 2, 0, 0],
              },
            ].filter(Boolean),
          },
        ],
      ].filter(Boolean),
    },
    layout: ruled(),
  };

  // 2. Who it is for, beside the bill's number, date and payment.
  const detail = (label, value, bold = false) => [
    { text: label, color: MUTED, fontSize: P.small },
    { text: value || "-", bold, fontSize: P.small, alignment: "right" },
  ];
  const parties = {
    table: {
      widths: ["*", sideWidth],
      body: [
        [
          {
            stack: [
              { text: t("invoice.billedTo"), color: MUTED, fontSize: P.tiny },
              {
                text: customer.vendorName || "—",
                bold: true,
                fontSize: P.base + 1,
                margin: [0, 2, 0, 0],
              },
              customer.vendorPhone && {
                text: `${t("invoice.mobile")} ${customer.vendorPhone}`,
                fontSize: P.small,
              },
              customer.address && { text: customer.address, fontSize: P.small },
              buyerGSTIN && {
                text: `${t("invoice.gstin")}: ${buyerGSTIN}`,
                bold: true,
                fontSize: P.small,
                margin: [0, 2, 0, 0],
              },
              buyerState && {
                text: `${t("invoice.stateCode")}: ${buyerState}`,
                fontSize: P.small,
              },
            ].filter(Boolean),
          },
          {
            table: {
              widths: ["auto", "*"],
              body: [
                detail(t("invoice.invoiceNo"), bill?.invoiceNo, true),
                detail(t("invoice.date"), f.date),
                f.time && detail(t("invoice.time"), f.time),
                detail(t("invoice.payment"), paymentLabel(bill?.payment, t)),
              ].filter(Boolean),
            },
            layout: unruled,
          },
        ],
      ],
    },
    layout: ruled(),
  };

  // 3. The goods, in a tall ruled table like a bill book page. HSN only
  //    appears when a line carries one.
  const hasHsn = f.lines.some((line) => String(line.hsn ?? "").trim());
  const columns = [
    { key: "sno", label: t("invoice.sNo"), width: P.cols.sno, align: "center" },
    { key: "item", label: t("invoice.description"), width: "*", align: "left" },
    { key: "qty", label: t("invoice.qty"), width: P.cols.qty, align: "center" },
    hasHsn && {
      key: "hsn",
      label: t("invoice.hsn"),
      width: P.cols.hsn,
      align: "center",
    },
    {
      key: "rate",
      label: t("invoice.rate"),
      width: P.cols.rate,
      align: "right",
    },
    {
      key: "amount",
      label: t("invoice.amount"),
      width: P.cols.amount,
      align: "right",
    },
  ].filter(Boolean);

  const cellsOf = (line, index) => ({
    sno: String(index + 1),
    item: line.itemName || "-",
    qty: `${formatQuantity(line.itemQuantity)} ${line.quantityCategory || ""}`.trim(),
    hsn: String(line.hsn ?? "").trim(),
    rate: rateText(line),
    amount: formatMoney(f.lineTotal(line)),
  });

  const items = {
    table: {
      headerRows: 1,
      widths: columns.map((column) => column.width),
      body: [
        columns.map((column) => ({
          text: column.label,
          bold: true,
          alignment: column.align,
          fontSize: P.small,
          fillColor: FILL,
        })),
        ...f.lines.map((line, index) => {
          const cells = cellsOf(line, index);
          return columns.map((column) => ({
            text: cells[column.key],
            alignment: column.align,
          }));
        }),
        ...Array.from({ length: blankRows }, () =>
          columns.map(() => ({ text: " " })),
        ),
      ],
    },
    // Columns ruled top to bottom; rows only under the header and at the end.
    layout: ruled({
      hLineWidth: (i, node) =>
        i <= 1 || i === node.table.body.length ? 0.8 : 0,
    }),
  };

  // 4. The amount in words beside the totals.
  const figure = (label, value, style = {}) => [
    { text: label, fontSize: P.small, ...style },
    { text: value, fontSize: P.small, alignment: "right", ...style },
  ];
  const taxes =
    f.gst > 0
      ? splitGst({
          gstAmount: f.gst,
          gstRate: f.gstRate,
          sellerGSTIN,
          buyerGSTIN,
        })
      : [];
  const totals = [
    // With nothing between them, Total would only repeat the grand total.
    (f.discount > 0 || f.gst > 0) &&
      figure(t("invoice.total"), money(f.subtotal)),
    f.discount > 0 && figure(t("invoice.discount"), `− ${money(f.discount)}`),
    f.gst > 0 &&
      f.discount > 0 &&
      figure(t("invoice.taxable"), money(f.subtotal - f.discount)),
    ...taxes.map((tax) =>
      figure(
        t(`invoice.${tax.key}`, { rate: formatRate(tax.rate) }),
        money(tax.amount),
      ),
    ),
    [
      {
        text: t("invoice.grandTotal"),
        bold: true,
        fontSize: P.base,
        fillColor: FILL,
      },
      {
        text: money(f.total),
        bold: true,
        fontSize: P.base + 1.5,
        alignment: "right",
        fillColor: FILL,
      },
    ],
    f.paidRecorded && figure(t("invoice.paid"), money(f.amountPaid)),
    f.change > 0 && figure(t("invoice.change"), money(f.change)),
    f.owed > 0 &&
      figure(t("invoice.balance"), money(f.owed), {
        bold: true,
        color: ACCENT,
      }),
  ].filter(Boolean);

  const bottom = {
    table: {
      widths: ["*", sideWidth],
      body: [
        [
          {
            stack: [
              {
                text: t("invoice.amountInWords"),
                color: MUTED,
                fontSize: P.tiny,
              },
              {
                text: amountInWords(f.total, lang),
                bold: true,
                fontSize: P.small,
                margin: [0, 2, 0, 0],
              },
              {
                text: t("invoice.itemCount", { count: f.lines.length }),
                color: MUTED,
                fontSize: P.tiny,
                margin: [0, 6, 0, 0],
              },
            ],
            margin: [6, P.pad, 6, P.pad],
          },
          {
            table: { widths: ["*", "auto"], body: totals },
            layout: {
              hLineWidth: (i, node) =>
                i === 0 || i === node.table.body.length ? 0 : 0.6,
              vLineWidth: () => 0,
              hLineColor: () => RULE,
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 2.5,
              paddingBottom: () => 2.5,
            },
          },
        ],
      ],
    },
    // The left cell pads itself, so the totals can run edge to edge.
    layout: ruled({
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    }),
  };

  // 5. The declaration, then both signatures on one line.
  const SIGN_GAP = 22;
  const signatures = {
    table: {
      widths: ["*", sideWidth],
      body: [
        [
          {
            text: t("invoice.declaration"),
            color: MUTED,
            fontSize: P.tiny,
            colSpan: 2,
          },
          {},
        ],
        [
          {
            text: t("invoice.customerSign"),
            bold: true,
            fontSize: P.small,
            // Level with "Auth. Signatory": one line of "For …" plus the gap.
            margin: [0, P.small * 1.3 + SIGN_GAP, 0, 0],
          },
          {
            stack: [
              {
                text: t("invoice.forShop", { shop: shopName }),
                bold: true,
                color: ACCENT,
                fontSize: P.small,
                alignment: "right",
              },
              {
                text: t("invoice.signatory"),
                bold: true,
                fontSize: P.small,
                alignment: "right",
                margin: [0, SIGN_GAP, 0, 0],
              },
            ],
          },
        ],
      ],
    },
    layout: ruled({
      hLineWidth: (i, node) =>
        i === 0 || i === node.table.body.length ? 0.8 : 0,
      vLineWidth: (i, node) =>
        i === 0 || i === node.table.widths.length ? 0.8 : 0,
    }),
  };

  return {
    pageSize: P.pageSize,
    pageMargins: [P.margin, P.margin, P.margin, P.margin],
    info: { title: bill?.invoiceNo || "invoice" },
    defaultStyle: {
      font: FONT,
      fontSize: P.base,
      color: INK,
      lineHeight: 1.15,
    },
    content: [
      header,
      parties,
      items,
      bottom,
      signatures,
      settings.receiptFooter && {
        text: settings.receiptFooter,
        alignment: "center",
        color: MUTED,
        fontSize: P.small,
        margin: [0, 6, 0, 0],
      },
    ].filter(Boolean),
  };
};

/* -------------------------------------------------------------- thermal */

const thermalRule = (margin = [0, 6, 0, 6]) => ({
  canvas: [
    {
      type: "line",
      x1: 0,
      y1: 0,
      x2: THERMAL_RULE,
      y2: 0,
      lineWidth: 0.5,
      color: "#aaa",
    },
  ],
  margin,
});

/** A right-aligned label/value pair in the receipt's totals. */
const thermalRow = (label, value, { bold = false, size = 9 } = {}) => ({
  columns: [
    { text: label, alignment: "left", fontSize: size, bold },
    { text: value, alignment: "right", fontSize: size, bold },
  ],
  margin: [0, 1, 0, 1],
});

const thermalDoc = (bill, { settings, t }) => {
  const f = billFacts(bill, settings);
  const currency = settings.currencySymbol || "₹";
  const money = (value) => `${currency}${formatMoney(value)}`;
  const customer = bill?.customerInfo;

  const shop = [
    { text: settings.shopName || "", style: "header", alignment: "center" },
    settings.shopAddress && {
      text: settings.shopAddress,
      fontSize: 7,
      alignment: "center",
      margin: [0, 2, 0, 0],
    },
    settings.shopPhone && {
      text: `${t("invoice.phone")}: ${settings.shopPhone}`,
      fontSize: 7,
      alignment: "center",
    },
    settings.shopGSTIN && {
      text: `${t("invoice.gstin")}: ${settings.shopGSTIN}`,
      fontSize: 7,
      alignment: "center",
    },
  ].filter(Boolean);

  const buyer = customer?.vendorName && {
    stack: [
      { text: `${t("invoice.customer")}: ${customer.vendorName}`, fontSize: 8 },
      customer.vendorPhone && {
        text: `${t("invoice.phone")}: ${customer.vendorPhone}`,
        fontSize: 8,
      },
      customer.address && {
        text: `${t("invoice.address")}: ${customer.address}`,
        fontSize: 8,
      },
      bill?.GSTNumber && {
        text: `${t("invoice.gstin")}: ${bill.GSTNumber}`,
        fontSize: 8,
      },
    ].filter(Boolean),
    margin: [0, 6, 0, 0],
  };

  const totals = [
    thermalRow(t("invoice.subtotal"), money(f.subtotal)),
    f.discount > 0 &&
      thermalRow(t("invoice.discount"), `- ${money(f.discount)}`),
    f.gst > 0 &&
      thermalRow(
        t("invoice.gst", { rate: formatRate(f.gstRate) }),
        money(f.gst),
      ),
    thermalRow(t("invoice.grandTotal"), money(f.total), {
      bold: true,
      size: 11,
    }),
    f.amountPaid > 0 && thermalRow(t("invoice.paid"), money(f.amountPaid)),
    f.change > 0 && thermalRow(t("invoice.change"), money(f.change)),
    f.owed > 0 &&
      thermalRow(t("invoice.balance"), money(f.owed), { bold: true }),
  ].filter(Boolean);

  return {
    pageSize: { width: THERMAL_WIDTH, height: "auto" },
    pageMargins: [10, 10, 10, 10],
    info: { title: bill?.invoiceNo || "receipt" },
    defaultStyle: { font: FONT, fontSize: 9 },
    content: [
      ...shop,
      thermalRule([0, 8, 0, 8]),
      {
        columns: [
          {
            text: `${t("invoice.invoiceNo")}: ${bill?.invoiceNo || ""}`,
            fontSize: 9,
          },
          {
            text: `${t("invoice.date")}: ${f.date}`,
            alignment: "right",
            fontSize: 9,
          },
        ],
      },
      buyer,
      {
        table: {
          widths: ["*", 46, "auto", "auto"],
          headerRows: 1,
          body: [
            [
              { text: t("invoice.item"), bold: true },
              { text: t("invoice.qty"), bold: true },
              { text: t("invoice.rate"), bold: true, alignment: "right" },
              { text: t("invoice.amount"), bold: true, alignment: "right" },
            ],
            ...f.lines.map((line) => [
              line.itemName || "-",
              `${line.itemQuantity ?? ""} ${line.quantityCategory ?? ""}`.trim(),
              { text: formatMoney(line.price), alignment: "right" },
              { text: formatMoney(f.lineTotal(line)), alignment: "right" },
            ]),
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#aaa",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
        margin: [0, 8, 0, 0],
      },
      {
        text: t("invoice.itemCount", { count: f.lines.length }),
        fontSize: 8,
        margin: [0, 4, 0, 0],
      },
      thermalRule(),
      ...totals,
      thermalRule(),
      {
        text: `${t("invoice.payment")}: ${paymentLabel(bill?.payment, t)}`,
        fontSize: 9,
      },
      settings.receiptFooter && {
        text: settings.receiptFooter,
        style: "footer",
        alignment: "center",
      },
    ].filter(Boolean),
    styles: {
      header: { fontSize: 14, bold: true },
      footer: { fontSize: 10, margin: [0, 16, 0, 0] },
    },
  };
};

/* --------------------------------------------------------- safe shaping */

/**
 * fontkit, which pdfmake shapes text with, throws on some mark sequences and
 * the whole bill then fails to print: a nasal on a stand-alone vowel
 * ("અંકિત", "આંબા"), a sign typed after a stand-alone vowel ("અે" for "એ"),
 * a mark after a Latin letter, a sign after a virama. Checked against every
 * vowel, consonant, sign and mark pairing, these are all of them.
 */
const FRAGILE_MARKS =
  /(?:^|[^ક-હ઼ઁ-ઃા-્])[ઁ-ઃ઼-્]|[ઁ-ઃ઼-્][઼્]|[ા-ૌ][ા-ૌ]|્[ઁ-ઃા-ૌ]|ળ઼/;

/** Mark positioning off: the mark sits in the font's default place instead. */
const marksOff = () => ({ abvm: false, blwm: false, mark: false, mkmk: false });

/** Where a pdfmake document keeps text and the blocks that hold it. */
const NESTED = ["content", "stack", "columns", "table", "body"];

/**
 * Lay out every fragile text with mark positioning off; everything else
 * keeps full shaping. Returns a new document.
 */
export const guardShaping = (node) => {
  if (Array.isArray(node)) return node.map(guardShaping);
  if (typeof node === "string") {
    return FRAGILE_MARKS.test(node)
      ? { text: node, fontFeatures: marksOff() }
      : node;
  }
  if (!node || typeof node !== "object") return node;

  const guarded = { ...node };
  NESTED.forEach((key) => {
    if (key in guarded) guarded[key] = guardShaping(guarded[key]);
  });
  if (Array.isArray(guarded.text)) guarded.text = guardShaping(guarded.text);
  if (typeof guarded.text === "string" && FRAGILE_MARKS.test(guarded.text)) {
    guarded.fontFeatures = marksOff();
  }
  return guarded;
};

/**
 * The most blank rows that keep the bill on the pages it needs anyway, found
 * by laying it out: a binary search, so a handful of layouts.
 */
const fillPage = (build, countPages, most) => {
  const pagesNeeded = countPages(build(0));
  let low = 0;
  let high = most;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (countPages(build(middle)) <= pagesNeeded) low = middle;
    else high = middle - 1;
  }
  return build(low);
};

/**
 * @param {object} bill a saved order, or the live bill from the billing screen
 * @param {object} options
 * @param {object} options.settings the shop settings (paper, shop details)
 * @param {Function} options.t a translator fixed to the bill's language
 * @param {string} options.lang "gu" or "en", for the amount in words
 * @param {Function} [options.countPages] lays a document out and returns its
 *   page count; with it the items table grows to fill the page exactly, like
 *   a bill book, without spilling onto another page.
 */
export const buildInvoiceDoc = (
  bill,
  { settings, t, lang = "gu", countPages },
) => {
  if (settings.billPaper === "thermal") {
    return guardShaping(thermalDoc(bill, { settings, t }));
  }
  const build = (blankRows) =>
    guardShaping(bookDoc(bill, { settings, t, lang, blankRows }));
  if (!countPages) return build(FALLBACK_BLANK_ROWS);
  const paper = PAPER[settings.billPaper] || PAPER.A4;
  return fillPage(build, countPages, paper.mostBlankRows);
};
