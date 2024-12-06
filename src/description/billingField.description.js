export const billingFields = [
  {
    md: 4,
    billingFormFields: [
      {
        name: "invoiceNo",
        type: "text",
        label: "Invoice No.",
        md: 6,
        disabled: true,
        sector: "customerInfo",
      },
      {
        name: "billingDate",
        type: "datePicker",
        label: "Billing Date",
        md: 6,
        sector: "customerInfo",
      },
      {
        name: "vendorName",
        type: "autoComplete",
        label: "Vendor Name",
        option: "",
        md: 12,
        sector: "customerInfo",
        pattern: "notEmpty",
        addNew: "Add New Customer",
      },
      {
        name: "vendorPhone",
        type: "number",
        label: "Phone Number",
        md: 12,
        sector: "customerInfo",
      },
      {
        name: "address",
        type: "text",
        label: "Vendor Address",
        md: 12,
        rows: 1,
        multiline: true,
        sector: "customerInfo",
        gutterNone: true,
      },
    ],
  },
  {
    md: 4,
    sx: { mx: "auto" },
    billingFormFields: [
      {
        name: "itemName",
        type: "autoComplete",
        label: "Item Name",
        option: "",
        md: 12,
        sector: "order",
        pattern: "notEmpty",
        addNew: "Add New Item",
      },
      {
        name: "itemQuantity",
        type: "number",
        label: "Item Quantity",
        md: 4,
        endAdornment: true,
        sector: "order",
        pattern: "notEmpty",
      },
      {
        label: "",
        name: "quantityCategory",
        type: "select",
        defaultValue: "Kg",
        menu: ["Kg", "Grams", "Pcs."],
        md: 4,
        sector: "order",
      },
      {
        name: "price",
        type: "number",
        label: "Price",
        md: 4,
        disabled: true,
        sector: "order",
      },
      {
        name: "GST",
        type: "radio",
        label: "GST(18%)",
        md: 6,
        defaultValue: "no",
        sector: "order",
        list: [
          { label: "No", value: "no" },
          { label: "Yes", value: "yes" },
        ],
      },
      {
        name: "GSTNumber",
        type: "number",
        label: "GST Number",
        sector: "order",
        disabled: (formData) => formData?.GST !== "yes",
        md: 6,
        pattern: "notEmpty",
      },
      {
        label: "Payment",
        name: "payment",
        type: "select",
        defaultValue: "Cash",
        menu: ["Cash", "UPI"],
        md: 6,
        sector: "order",
        gutterNone: true,
      },
      {
        label: "Amount Pay",
        name: "amountPay",
        type: "number",
        md: 6,
        sector: "order",
        gutterNone: true,
        disabled: (formData) => formData?.payment !== "Cash",
      },
    ],
  },
  {
    md: 3,
    billingFormFields: [
      {
        name: "subtotal",
        type: "number",
        label: "Subtotal",
        md: 12,
        row: true,
        disabled: true,
      },
      {
        name: "total",
        type: "number",
        label: "Total Price",
        md: 12,
        row: true,
        disabled: true,
      },
    ],
  },
];