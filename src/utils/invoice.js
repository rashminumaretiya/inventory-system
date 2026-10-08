import { money, num } from "./billing";

/**
 * Pieces of a GST tax invoice that are rules rather than layout: the state a
 * GSTIN belongs to, how the tax is split, and the total written in words.
 */

/** The two-digit GST state code a GSTIN starts with, e.g. "24" for Gujarat. */
export const gstStateCode = (gstin) => {
  const match = /^(\d{2})[A-Z]/i.exec(String(gstin ?? "").trim());
  return match ? match[1] : "";
};

/**
 * How a bill's GST is shown: CGST + SGST, half each, within a state; IGST
 * when the buyer's GSTIN is from another state than the seller's. Rates are
 * the share of the bill's GST rate; the two halves always add back up.
 */
export const splitGst = ({ gstAmount, gstRate, sellerGSTIN, buyerGSTIN }) => {
  const amount = money(gstAmount);
  const rate = num(gstRate);
  const from = gstStateCode(sellerGSTIN);
  const to = gstStateCode(buyerGSTIN);

  if (from && to && from !== to) return [{ key: "igst", rate, amount }];

  const cgst = money(amount / 2);
  return [
    { key: "cgst", rate: rate / 2, amount: cgst },
    { key: "sgst", rate: rate / 2, amount: money(amount - cgst) },
  ];
};

/* ------------------------------------------------------- amount in words */

const EN_ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const EN_TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

const enUpTo99 = (n) =>
  n < 20
    ? EN_ONES[n]
    : [EN_TENS[Math.floor(n / 10)], EN_ONES[n % 10]].filter(Boolean).join(" ");

const enUpTo999 = (n) =>
  [
    Math.floor(n / 100) ? `${EN_ONES[Math.floor(n / 100)]} Hundred` : "",
    n % 100 ? enUpTo99(n % 100) : "",
  ]
    .filter(Boolean)
    .join(" ");

/** Gujarati has its own word for every number up to 99. */
const GU_UP_TO_99 = [
  "", "એક", "બે", "ત્રણ", "ચાર", "પાંચ", "છ", "સાત", "આઠ", "નવ",
  "દસ", "અગિયાર", "બાર", "તેર", "ચૌદ", "પંદર", "સોળ", "સત્તર", "અઢાર", "ઓગણીસ",
  "વીસ", "એકવીસ", "બાવીસ", "ત્રેવીસ", "ચોવીસ", "પચ્ચીસ", "છવ્વીસ", "સત્તાવીસ", "અઠ્ઠાવીસ", "ઓગણત્રીસ",
  "ત્રીસ", "એકત્રીસ", "બત્રીસ", "તેત્રીસ", "ચોત્રીસ", "પાંત્રીસ", "છત્રીસ", "સાડત્રીસ", "આડત્રીસ", "ઓગણચાલીસ",
  "ચાલીસ", "એકતાલીસ", "બેતાલીસ", "તેતાલીસ", "ચુમ્માલીસ", "પિસ્તાલીસ", "છેતાલીસ", "સુડતાલીસ", "અડતાલીસ", "ઓગણપચાસ",
  "પચાસ", "એકાવન", "બાવન", "ત્રેપન", "ચોપન", "પંચાવન", "છપ્પન", "સત્તાવન", "અઠ્ઠાવન", "ઓગણસાઠ",
  "સાઠ", "એકસઠ", "બાસઠ", "ત્રેસઠ", "ચોસઠ", "પાંસઠ", "છાસઠ", "સડસઠ", "અડસઠ", "અગણોસિત્તેર",
  "સિત્તેર", "એકોતેર", "બોતેર", "તોતેર", "ચુમોતેર", "પંચોતેર", "છોતેર", "સિત્યોતેર", "ઇઠ્યોતેર", "ઓગણાએંસી",
  "એંસી", "એક્યાસી", "બ્યાસી", "ત્યાસી", "ચોર્યાસી", "પંચાસી", "છ્યાસી", "સિત્યાસી", "ઈઠ્યાસી", "નેવ્યાસી",
  "નેવું", "એકાણું", "બાણું", "ત્રાણું", "ચોરાણું", "પંચાણું", "છન્નું", "સત્તાણું", "અઠ્ઠાણું", "નવ્વાણું",
];

/** 100 is એકસો and 200 is બસો; the rest are the number plus સો. */
const guHundreds = (h) => (h === 1 ? "એકસો" : h === 2 ? "બસો" : `${GU_UP_TO_99[h]}સો`);

const guUpTo999 = (n) =>
  [
    Math.floor(n / 100) ? guHundreds(Math.floor(n / 100)) : "",
    n % 100 ? GU_UP_TO_99[n % 100] : "",
  ]
    .filter(Boolean)
    .join(" ");

const WORDS = {
  en: {
    upTo99: enUpTo99,
    upTo999: enUpTo999,
    zero: "Zero",
    crore: "Crore",
    lakh: "Lakh",
    thousand: "Thousand",
    phrase: (rupees, paise) =>
      `Rupees ${rupees}${paise ? ` and ${paise} Paise` : ""} Only`,
  },
  gu: {
    upTo99: (n) => GU_UP_TO_99[n],
    upTo999: guUpTo999,
    zero: "શૂન્ય",
    crore: "કરોડ",
    lakh: "લાખ",
    thousand: "હજાર",
    phrase: (rupees, paise) =>
      `રૂપિયા ${rupees}${paise ? ` અને ${paise} પૈસા` : ""} પૂરા`,
  },
};

/** A whole number in the Indian system: crore, lakh, thousand, hundreds. */
const indianWords = (n, w) => {
  if (n === 0) return w.zero;
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  return [
    crore ? `${indianWords(crore, w)} ${w.crore}` : "",
    lakh ? `${w.upTo99(lakh)} ${w.lakh}` : "",
    thousand ? `${w.upTo99(thousand)} ${w.thousand}` : "",
    rest ? w.upTo999(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * A bill total in words, as written under the figures on an Indian invoice:
 * "Rupees Four Hundred Seventy Two and Fifty Paise Only", or in Gujarati
 * "રૂપિયા ચારસો બોતેર અને પચાસ પૈસા પૂરા".
 */
export const amountInWords = (value, lang = "en") => {
  const w = WORDS[lang] || WORDS.en;
  const totalPaise = Math.round(Math.abs(num(value)) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  return w.phrase(indianWords(rupees, w), paise ? w.upTo99(paise) : "");
};
