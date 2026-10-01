/**
 * The billing form, described as data.
 *
 * Groups match where things sit on screen:
 *   invoice  — bill number and date, top of the right-hand panel
 *   customer — who the bill is for, a single row above the cart
 *   entry    — the item being added, a bar directly above the cart
 *   payment  — GST and discount, in the right-hand panel
 *   tender   — payment mode and money taken, pinned beside the total
 *
 * The totals are not fields at all: they are calculated, so they render as a
 * receipt-style summary rather than read-only input boxes.
 *
 * `sector` says where a value belongs — `customerInfo`, `order` (the line being
 * entered) or `bill` (the whole bill). `xs`/`md` are grid widths inside a group.
 */
export const billingFields = [
  {
    key: "invoice",
    billingFormFields: [
      {
        name: "invoiceNo",
        type: "text",
        label: "formLabel.invoiceNo",
        xs: 5,
        md: 5,
        disabled: true,
        sector: "meta",
      },
      {
        name: "billingDate",
        type: "datePicker",
        label: "formLabel.billingDate",
        xs: 7,
        md: 7,
        sector: "meta",
      },
    ],
  },
  {
    key: "customer",
    billingFormFields: [
      {
        name: "vendorName",
        type: "autoComplete",
        label: "formLabel.customerName",
        option: "",
        xs: 12,
        md: 4,
        sector: "customerInfo",
        pattern: "notEmpty",
        addNew: "buttonText.newShort",
      },
      {
        name: "vendorPhone",
        type: "text",
        label: "formLabel.phoneNumber",
        xs: 12,
        md: 4,
        sector: "customerInfo",
        pattern: "optionalPhone",
      },
      {
        name: "address",
        type: "text",
        label: "formLabel.customerAddress",
        xs: 12,
        md: 4,
        sector: "customerInfo",
      },
    ],
  },
  {
    key: "entry",
    billingFormFields: [
      {
        name: "itemName",
        type: "autoComplete",
        label: "formLabel.itemName",
        option: "",
        xs: 12,
        md: 12,
        sector: "order",
        pattern: "notEmpty",
        addNew: "buttonText.newShort",
      },
      {
        name: "itemQuantity",
        type: "number",
        label: "formLabel.itemQuantity",
        xs: 5,
        md: 5,
        sector: "order",
        pattern: "positiveNumber",
        inputProps: { min: 0, step: "any" },
      },
      {
        label: "",
        ariaLabel: "formLabel.unit",
        name: "quantityCategory",
        type: "select",
        defaultValue: "Kg",
        xs: 3,
        md: 3,
        sector: "order",
        // Narrowed to the selected product's unit family in
        // dashboard.container.js, so a counted item is never billed in Kg.
        menu: ["Kg", "Grams", "Pcs."],
      },
      {
        name: "price",
        type: "number",
        label: "description.price",
        xs: 4,
        md: 4,
        sector: "order",
        pattern: "positiveNumber",
        inputProps: { min: 0, step: "any" },
      },
    ],
  },
  {
    key: "payment",
    billingFormFields: [
      {
        name: "GST",
        type: "radio",
        label: "formLabel.GST",
        xs: 6,
        md: 6,
        defaultValue: "no",
        sector: "bill",
        list: [
          { label: "No", value: "no" },
          { label: "Yes", value: "yes" },
        ],
      },
      {
        name: "GSTNumber",
        // GSTINs are alphanumeric (24ABCDE1234F1Z5), so not a number input.
        type: "text",
        label: "formLabel.GSTNumber",
        sector: "bill",
        disabled: (formData) => formData?.GST !== "yes",
        xs: 6,
        md: 6,
        pattern: "gstin",
      },
      {
        label: "formLabel.discount",
        name: "discount",
        type: "number",
        xs: 12,
        md: 12,
        sector: "bill",
        pattern: "nonNegative",
        inputProps: { min: 0, step: "any" },
      },
    ],
  },
  {
    // Used on nearly every bill, so it is pinned beside the total.
    key: "tender",
    billingFormFields: [
      {
        label: "formLabel.payment",
        name: "payment",
        type: "select",
        defaultValue: "Cash",
        menu: ["Cash", "Pending", "Online"],
        xs: 6,
        md: 6,
        sector: "bill",
      },
      {
        label: "formLabel.amountPay",
        name: "amountPay",
        type: "number",
        xs: 6,
        md: 6,
        sector: "bill",
        // Nothing is collected up front on an unpaid bill.
        disabled: (formData) => formData?.payment === "Pending",
        inputProps: { min: 0, step: "any" },
      },
    ],
  },
];
