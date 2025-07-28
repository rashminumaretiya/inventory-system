import pdfMake from "pdfmake/build/pdfmake";
import { gujaratiVfs } from "./fonts/gujaratiVfs"; // adjust path if needed

pdfMake.vfs = {
  ...pdfMake.vfs,
  ...gujaratiVfs,
};

pdfMake.fonts = {
  ...pdfMake.fonts,
  gujarati: {
    normal: "NotoSansGujarati-Regular.ttf",
    bold: "NotoSansGujarati-Bold.ttf", // use same file for bold
  },
};

export const Print = () => {
  const generateReceipt = ({ addData, formData }) => {
    const docDefinition = {
      pageSize: { width: 230, height: "auto" },
      pageMargins: [10, 10, 10, 10],
      defaultStyle: {
        font: "gujarati", // Use Gujarati font
        fontSize: 9,
      },
      content: [
        {
          text: "દેવાંગી તમાકુ\n", // Gujarati Title
          style: "header",
          alignment: "center",
        },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 210,
              y2: 0,
              lineWidth: 0.5,
              color: "#aaa",
            },
          ],
          margin: [0, 10, 0, 10],
        },
        {
          columns: [
            {
              text: `ઓર્ડર નં: ${formData?.invoiceNo || ""}`,
              alignment: "left",
              fontSize: 9,
            },
            {
              text: `તારીખ: ${new Date(
                formData?.billingDate
              ).toLocaleDateString()}`,
              alignment: "right",
              fontSize: 9,
            },
          ],
        },
        formData?.customerInfo?.vendorName
          ? {
              text: `\nગ્રાહક: ${formData.customerInfo.vendorName}\nફોન: ${formData.customerInfo.vendorPhone}\nસરનામું: ${formData.customerInfo.address}\n\n`,
              fontSize: 8,
            }
          : "",
        {
          table: {
            widths: ["*", 50, "auto", "auto"],
            body: [
              [
                { text: "વસ્તુ", bold: true },
                { text: "જથ્થો", bold: true },
                { text: "ભાવ", bold: true },
                { text: "કુલ", bold: true, alignment: "right" },
              ],
              ...addData.map((item) => [
                item.itemName || "-",
                `${item.itemQuantity || ""} ${
                  item.quantityCategory || ""
                }`.trim() || "1",
                item.price || "0",
                { text: item.subtotal || "0", alignment: "right" },
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
          margin: [0, 10, 0, 0],
        },
        {
          text: `\n\nGST: ₹${formData?.GSTAmount || "0.00"}`,
          bold: true,
          alignment: "right",
          fontSize: 10,
        },
        {
          text: `\nકુલ રકમ: ₹${formData?.total || "0.00"}`,
          bold: true,
          alignment: "right",
          fontSize: 10,
        },
        {
          text: "\nઆભાર! ફરી મુલાકાત લો!",
          style: "footer",
          alignment: "center",
        },
      ],
      styles: {
        header: { fontSize: 14, bold: true },
        footer: { fontSize: 10, margin: [0, 20, 0, 0] },
      },
    };

    pdfMake.createPdf(docDefinition).open();
  };

  return { generateReceipt };
};
