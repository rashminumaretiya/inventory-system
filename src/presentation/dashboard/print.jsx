import pdfMake from "pdfmake/build/pdfmake";

import i18n from "../../i18n/i18n";
import { buildInvoiceDoc } from "../../utils/invoiceDoc";
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

/**
 * How many pages pdfmake lays a document out on. Synchronous because the
 * fonts come from the bundled vfs, so it can run inside the click that prints
 * (a print window opened later would be blocked).
 */
const countPages = (docDefinition) =>
  pdfMake.createPdf(docDefinition)._createDoc()._pdfMakePages.length;

export const Print = () => {
  /**
   * `bill` is a saved order record or the live bill from the billing screen;
   * both carry the same fields. The paper and the language come from the
   * shop's settings, not from the app's current language: the bill is for the
   * customer.
   */
  const buildDocDefinition = (bill) => {
    const settings = getSettings();
    const lang = settings.billLanguage === "en" ? "en" : "gu";
    return buildInvoiceDoc(bill, {
      settings,
      t: i18n.getFixedT(lang),
      lang,
      countPages,
    });
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
