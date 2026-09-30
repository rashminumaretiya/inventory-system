import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { apiResponse } from "../../../api";
import i18n from "../../../i18n/i18n";
import theme from "../../../shared/theme";
import customerReducer from "../../../store/slice/customerSlice";
import languageReducer from "../../../store/slice/languageSlice";
import orderReducer from "../../../store/slice/orderSlice";
import productReducer from "../../../store/slice/productSlice";
import Dashboard from "../index";

jest.mock("../../../api", () => ({ apiResponse: jest.fn() }));
// The receipt needs a real PDF engine; the billing flow under test does not.
jest.mock("../print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p-potato", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
  { id: "p-waffer", itemName: "Waffer", price: "10", stock: "120.000", quantityCategory: "Pcs." },
  // Stored as a legacy "Grams" product, whose stock is really 1.86 Kg.
  { id: "p-chilli", itemName: "Chilli", price: "20", stock: "1.860", quantityCategory: "Grams" },
];

const venders = [
  { id: "v-jay", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
];

// Note the gap: DT_2 and DT_3 were deleted.
const orders = [
  { id: "o-1", invoiceNo: "DT_1", billingDate: "2025-08-25T00:00:00.000Z", total: "470.00" },
  { id: "o-2", invoiceNo: "DT_4", billingDate: "2025-09-01T00:00:00.000Z", total: "1450.00" },
];

let posted;
let patched;

const renderDashboard = () => {
  const store = configureStore({
    reducer: {
      customer: customerReducer,
      product: productReducer,
      order: orderReducer,
      language: languageReducer,
    },
  });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Dashboard />
          </MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
};

const field = (name) => screen.getByRole("spinbutton", { name });
const textField = (name) => screen.getByRole("textbox", { name });

/** Type into a MUI Autocomplete and pick the matching option. */
const pickOption = async (label, text) => {
  const input = screen.getByRole("combobox", { name: label });
  fireEvent.change(input, { target: { value: text } });
  const option = await waitFor(() => {
    const options = screen.getAllByRole("option");
    const match = options.find((node) => node.textContent.includes(text));
    if (!match) throw new Error(`no option for ${text}`);
    return match;
  });
  fireEvent.click(option);
};

const setUnit = async (unit) => {
  const select = within(screen.getByTestId("quantityCategory-select")).getByRole(
    "combobox"
  );
  fireEvent.mouseDown(select);
  fireEvent.click(await screen.findByRole("option", { name: unit }));
};

const type = (element, value) =>
  fireEvent.change(element, { target: { value } });

/** Choose an item, set its quantity, then press Add New. */
const addLine = async (itemName, quantity, unit) => {
  await pickOption(/item name/i, itemName);
  if (unit) await setUnit(unit);
  type(field(/item quantity/i), String(quantity));
  fireEvent.click(screen.getByRole("button", { name: /add new/i }));
};

const cartRows = () =>
  screen
    .getAllByRole("row")
    .filter((row) => row.closest("tbody") && !row.textContent.includes("No Data"));

beforeEach(async () => {
  localStorage.clear();
  posted = [];
  patched = [];
  await i18n.changeLanguage("en");

  apiResponse.mockImplementation((url, method, config, payload) => {
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: orders });
    }
    if (method === "POST") {
      posted.push({ url, payload });
      return Promise.resolve({ success: true, data: payload });
    }
    if (method === "PATCH") {
      patched.push({ url, payload });
      return Promise.resolve({ success: true, data: payload });
    }
    return Promise.resolve({ success: true, data: {} });
  });
});

const ready = () => waitFor(() => expect(apiResponse).toHaveBeenCalledTimes(3));

describe("invoice numbering", () => {
  it("continues past the highest number used, not the order count", async () => {
    renderDashboard();
    // DT_1 and DT_4 exist, so a count-based scheme would wrongly reuse DT_3.
    await waitFor(() =>
      expect(textField(/invoice no/i)).toHaveValue("DT_5")
    );
  });
});

describe("adding lines", () => {
  it("prices a weight line and totals the bill", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);

    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));
    expect(field(/total price/i)).toHaveValue(22);
  });

  it("merges a repeat item rather than adding a second row", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));
    await addLine("Potato", 3);

    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(55));
    expect(cartRows().filter((row) => row.textContent.includes("Potato"))).toHaveLength(1);
  });

  it("merges grams into kilograms without losing a factor of 1000", async () => {
    renderDashboard();
    await ready();

    await addLine("Chilli", 500, "Grams");
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(10));

    await addLine("Chilli", 1, "Kg");
    // 500 g + 1 Kg = 1.5 Kg at Rs 20/Kg = Rs 30.00
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(30));
  });

  it("offers only pieces for a piece-counted item", async () => {
    renderDashboard();
    await ready();

    await pickOption(/item name/i, "Waffer");
    const select = within(screen.getByTestId("quantityCategory-select")).getByRole(
      "combobox"
    );
    await waitFor(() => expect(select).toHaveTextContent("Pcs."));
    fireEvent.mouseDown(select);
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Pcs."])
    );
  });

  it("refuses a quantity beyond stock, counting what is already in the cart", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 8);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(88));

    await addLine("Potato", 5); // 13 Kg against 9 Kg of stock
    expect(await screen.findByText(/only 1 Kg left in stock/i)).toBeInTheDocument();
    expect(field(/subtotal/i)).toHaveValue(88);
  });

  it("rejects a zero quantity", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 0);
    expect(
      await screen.findByText(/item quantity must be greater than 0/i)
    ).toBeInTheDocument();
  });
});

describe("bill totals", () => {
  it("applies GST at the configured rate, rounded to paise", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));

    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    await waitFor(() => expect(field(/gst amount/i)).toHaveValue(3.96));
    expect(field(/total price/i)).toHaveValue(25.96);
  });

  it("takes a discount off before GST", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));

    type(field(/^discount$/i), "2");
    await waitFor(() => expect(field(/total price/i)).toHaveValue(20));
  });

  it("works out change when the customer overpays", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));

    type(field(/amount paid/i), "50");
    await waitFor(() => expect(field(/^change$/i)).toHaveValue(28));
    expect(field(/balance due/i)).toHaveValue(0);
  });

  it("records a balance when the customer underpays", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));

    type(field(/amount paid/i), "10");
    await waitFor(() => expect(field(/balance due/i)).toHaveValue(12));
    expect(field(/^change$/i)).toHaveValue(0);
  });
});

describe("customer details", () => {
  it("fills phone and address from the chosen customer", async () => {
    renderDashboard();
    await ready();

    await pickOption(/customer name/i, "Jay");

    await waitFor(() => expect(textField(/phone number/i)).toHaveValue("9876543100"));
    expect(textField(/customer address/i)).toHaveValue("Bhavani circle");
  });

  it("keeps a phone edit out of the line item", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));

    type(textField(/phone number/i), "9812345678");

    // Editing the customer used to write the phone number into the cart line.
    await waitFor(() => expect(textField(/phone number/i)).toHaveValue("9812345678"));
    expect(field(/subtotal/i)).toHaveValue(22);
    expect(cartRows().some((row) => row.textContent.includes("9812345678"))).toBe(false);
  });

  it("rejects a malformed phone number", async () => {
    renderDashboard();
    await ready();

    type(textField(/phone number/i), "12345");
    expect(
      await screen.findByText(/valid 10 digit phone number/i)
    ).toBeInTheDocument();
  });
});

describe("saving", () => {
  it("will not save without a customer", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/please enter customer name/i)).toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  it("will not save an empty bill", async () => {
    renderDashboard();
    await ready();

    await pickOption(/customer name/i, "Jay");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(
      await screen.findByText(/please add at least one product/i)
    ).toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  it("requires a valid GSTIN once GST is switched on", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await pickOption(/customer name/i, "Jay");
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));

    type(textField(/gst number/i), "4322343"); // what the old number field allowed
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    expect(await screen.findByText(/valid gstin/i)).toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  it("saves the bill and deducts stock in base units", async () => {
    renderDashboard();
    await ready();

    await addLine("Chilli", 500, "Grams");
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(10));
    await pickOption(/customer name/i, "Jay");

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(posted).toHaveLength(1));
    const bill = posted[0].payload;
    expect(posted[0].url).toBe("/orders");
    expect(bill.invoiceNo).toBe("DT_5");
    expect(bill.total).toBe("10.00");
    expect(bill.customerInfo).toMatchObject({
      vendorName: "Jay",
      vendorPhone: "9876543100",
    });

    // 1.860 Kg of stock less 500 g leaves 1.360 Kg.
    await waitFor(() => expect(patched).toHaveLength(1));
    expect(patched[0].url).toBe("/product/p-chilli");
    expect(patched[0].payload.stock).toBe("1.360");
  });

  it("clears the bill after a successful save", async () => {
    renderDashboard();
    await ready();

    await addLine("Potato", 2);
    await pickOption(/customer name/i, "Jay");
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(posted).toHaveLength(1));
    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(0));
    expect(screen.getByText(/no data found/i)).toBeInTheDocument();
    expect(localStorage.getItem("formData")).toBeNull();
  });
});

describe("cart persistence", () => {
  it("restores an in-progress bill after a reload", async () => {
    localStorage.setItem(
      "formData",
      JSON.stringify([
        {
          id: "p-potato",
          itemName: "Potato",
          price: "11",
          itemQuantity: "2",
          quantityCategory: "Kg",
          baseQuantity: 2,
          subtotal: "22.00",
        },
      ])
    );

    renderDashboard();
    await ready();

    await waitFor(() => expect(field(/subtotal/i)).toHaveValue(22));
  });
});
