import pdfMake from "pdfmake/build/pdfmake";
import { formatMoney, num } from "../../utils/billing";
import { getSettings } from "../../utils/settings";
import { gujaratiVfs } from "./fonts/gujaratiVfs";

pdfMake.vfs = {
  ...pdfMake.vfs,
  ...gujaratiVfs,
};

pdfMake.fonts = {
  ...pdfMake.fonts,
  gujarati: {
    normal: "NotoSansGujarati-Regular.ttf",
    bold: "NotoSansGujarati-Bold.ttf",
  },
};

/** Receipt wording, kept together so it is easy to adjust. */
const LABEL = {
  invoice: "ઓર્ડર નં",
  date: "તારીખ",
  customer: "ગ્રાહક",
  phone: "ફોન",
  address: "સરનામું",
  gstin: "GSTIN",
  item: "વસ્તુ",
  qty: "જથ્થો",
  rate: "ભાવ",
  amount: "કુલ",
  subtotal: "સબટોટલ",
  discount: "ડિસ્કાઉન્ટ",
  gst: "જી.એસ.ટી.",
  total: "કુલ રકમ",
  paid: "ચૂકવેલ",
  change: "પરત",
  balance: "બાકી",
  payment: "પેમેન્ટ",
  items: "કુલ વસ્તુઓ",
};

const PAYMENT_LABEL = {
  Cash: "રોકડ",
  Online: "ઓનલાઇન",
  Pending: "બાકી",
};

const RECEIPT_WIDTH = 230;
const RULE_WIDTH = 210;

const rule = (margin = [0, 6, 0, 6]) => ({
  canvas: [
    {
      type: "line",
      x1: 0,
      y1: 0,
      x2: RULE_WIDTH,
      y2: 0,
      lineWidth: 0.5,
      color: "#aaa",
    },
  ],
  margin,
});

/** A right-aligned label/value pair in the totals block. */
const totalRow = (label, value, { bold = false, size = 9 } = {}) => ({
  columns: [
    { text: label, alignment: "left", fontSize: size, bold },
    { text: value, alignment: "right", fontSize: size, bold },
  ],
  margin: [0, 1, 0, 1],
});

export const Print = () => {
  /**
   * `bill` is a saved order record or the live bill from the billing screen;
   * both carry the same fields.
   */
  const buildDocDefinition = (bill) => {
    const settings = getSettings();
    const currency = settings.currencySymbol || "₹";
    const lines = bill?.order || [];

    const subtotal = num(
      bill?.subtotal ?? lines.reduce((sum, line) => sum + num(line.subtotal), 0)
    );
    const discountAmount = num(bill?.discountAmount ?? bill?.discount);
    const gstAmount = num(bill?.GSTAmount);
    const total = num(bill?.total);
    const amountPaid = num(bill?.amountPaid);
    const change = num(bill?.changeDue);
    const balance = num(bill?.balanceDue);
    const gstRate = num(bill?.GSTRate ?? settings.gstRate);
    const itemCount = lines.length;

    const shopHeader = [
      {
        text: settings.shopName || "",
        style: "header",
        alignment: "center",
      },
    ];
    if (settings.shopAddress) {
      shopHeader.push({
        text: settings.shopAddress,
        fontSize: 7,
        alignment: "center",
        margin: [0, 2, 0, 0],
      });
    }
    if (settings.shopPhone) {
      shopHeader.push({
        text: `${LABEL.phone}: ${settings.shopPhone}`,
        fontSize: 7,
        alignment: "center",
      });
    }
    if (settings.shopGSTIN) {
      shopHeader.push({
        text: `${LABEL.gstin}: ${settings.shopGSTIN}`,
        fontSize: 7,
        alignment: "center",
      });
    }

    const customer = bill?.customerInfo;
    const customerBlock = customer?.vendorName
      ? {
          stack: [
            { text: `${LABEL.customer}: ${customer.vendorName}`, fontSize: 8 },
            customer.vendorPhone
              ? { text: `${LABEL.phone}: ${customer.vendorPhone}`, fontSize: 8 }
              : null,
            customer.address
              ? { text: `${LABEL.address}: ${customer.address}`, fontSize: 8 }
              : null,
            bill?.GSTNumber
              ? { text: `${LABEL.gstin}: ${bill.GSTNumber}`, fontSize: 8 }
              : null,
          ].filter(Boolean),
          margin: [0, 6, 0, 0],
        }
      : null;

    const totalsBlock = [totalRow(LABEL.subtotal, `${currency}${formatMoney(subtotal)}`)];
    if (discountAmount > 0) {
      totalsBlock.push(
        totalRow(LABEL.discount, `- ${currency}${formatMoney(discountAmount)}`)
      );
    }
    if (gstAmount > 0) {
      totalsBlock.push(
        totalRow(
          `${LABEL.gst} (${gstRate}%)`,
          `${currency}${formatMoney(gstAmount)}`
        )
      );
    }
    totalsBlock.push(
      totalRow(LABEL.total, `${currency}${formatMoney(total)}`, {
        bold: true,
        size: 11,
      })
    );
    if (amountPaid > 0) {
      totalsBlock.push(totalRow(LABEL.paid, `${currency}${formatMoney(amountPaid)}`));
    }
    if (change > 0) {
      totalsBlock.push(totalRow(LABEL.change, `${currency}${formatMoney(change)}`));
    }
    if (balance > 0) {
      totalsBlock.push(
        totalRow(LABEL.balance, `${currency}${formatMoney(balance)}`, {
          bold: true,
        })
      );
    }

    return {
      pageSize: { width: RECEIPT_WIDTH, height: "auto" },
      pageMargins: [10, 10, 10, 10],
      defaultStyle: { font: "gujarati", fontSize: 9 },
      content: [
        ...shopHeader,
        rule([0, 8, 0, 8]),
        {
          columns: [
            {
              text: `${LABEL.invoice}: ${bill?.invoiceNo || ""}`,
              alignment: "left",
              fontSize: 9,
            },
            {
              text: `${LABEL.date}: ${new Date(
                bill?.billingDate || Date.now()
              ).toLocaleDateString()}`,
              alignment: "right",
              fontSize: 9,
            },
          ],
        },
        customerBlock,
        {
          table: {
            widths: ["*", 46, "auto", "auto"],
            headerRows: 1,
            body: [
              [
                { text: LABEL.item, bold: true },
                { text: LABEL.qty, bold: true },
                { text: LABEL.rate, bold: true, alignment: "right" },
                { text: LABEL.amount, bold: true, alignment: "right" },
              ],
              ...lines.map((line) => [
                line.itemName || "-",
                `${line.itemQuantity ?? ""} ${line.quantityCategory ?? ""}`.trim(),
                { text: formatMoney(line.price), alignment: "right" },
                { text: formatMoney(line.subtotal), alignment: "right" },
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
          text: `${LABEL.items}: ${itemCount}`,
          fontSize: 8,
          margin: [0, 4, 0, 0],
        },
        rule(),
        ...totalsBlock,
        rule(),
        {
          text: `${LABEL.payment}: ${
            PAYMENT_LABEL[bill?.payment] || bill?.payment || ""
          }`,
          fontSize: 9,
        },
        {
          text: settings.receiptFooter || "",
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

  /** Opens the print dialog directly — closer to how a till is used. */
  const generateReceipt = (bill) => {
    pdfMake.createPdf(buildDocDefinition(bill)).print();
  };

  /** Kept for saving a copy rather than printing. */
  const downloadReceipt = (bill) => {
    pdfMake
      .createPdf(buildDocDefinition(bill))
      .download(`${bill?.invoiceNo || "receipt"}.pdf`);
  };

  return { generateReceipt, downloadReceipt, buildDocDefinition };
};
