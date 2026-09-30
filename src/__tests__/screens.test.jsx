import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { apiResponse } from "../api";
import i18n from "../i18n/i18n";
import theme from "../shared/theme";
import customerReducer from "../store/slice/customerSlice";
import languageReducer from "../store/slice/languageSlice";
import orderReducer from "../store/slice/orderSlice";
import productReducer from "../store/slice/productSlice";

import Customer from "../presentation/customer";
import Orders from "../presentation/orders";
import Product from "../presentation/product";
import Reports from "../presentation/reports";
import Settings from "../presentation/settings";

jest.mock("../api", () => ({ apiResponse: jest.fn() }));
jest.mock("react-apexcharts", () => () => <div data-testid="chart" />);
jest.mock("../presentation/dashboard/print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p1", itemName: "Potato", price: "11", costPrice: "8", stock: "9.000", quantityCategory: "Kg" },
  { id: "p2", itemName: "Waffer", price: "10", stock: "0.000", quantityCategory: "Pcs." },
  { id: "p3", itemName: "Chilli", price: "20", stock: "1.860", quantityCategory: "Grams", lowStockAt: "5" },
];

const venders = [
  { id: "v1", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
  { id: "v2", name: "Abhi", phone: "9812121212", address: "" },
];

const orders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2025-08-25T00:00:00.000Z",
    subtotal: 470,
    total: "470.00",
    payment: "Cash",
    amountPaid: 470,
    balanceDue: 0,
    GSTAmount: 0,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100", address: "Bhavani circle" },
    order: [
      { id: "p1", itemName: "Potato", price: "11", itemQuantity: "2", quantityCategory: "Kg", subtotal: "22.00", baseQuantity: 2 },
    ],
  },
  {
    id: "o2",
    invoiceNo: "DT_2",
    billingDate: "2025-09-01T00:00:00.000Z",
    subtotal: 100,
    total: "100.00",
    payment: "Pending",
    amountPaid: 0,
    balanceDue: 100,
    GSTAmount: 0,
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212", address: "" },
    order: [
      { id: "p3", itemName: "Chilli", price: "20", itemQuantity: "5", quantityCategory: "Kg", subtotal: "100.00", baseQuantity: 5 },
    ],
  },
];

let calls;

const mount = (ui) => {
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
          <MemoryRouter>{ui}</MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
};

beforeEach(async () => {
  localStorage.clear();
  calls = [];
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url, method, config, payload) => {
    calls.push({ url, method, payload });
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: orders });
    }
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

describe("Product screen", () => {
  it("lists products with stock in the base unit", async () => {
    mount(<Product />);
    expect(await screen.findByText("Potato")).toBeInTheDocument();
    // Legacy "Grams" product shows its real stocking unit.
    const chilliRow = screen.getByText("Chilli").closest("tr");
    expect(chilliRow).toHaveTextContent("1.86");
    expect(chilliRow).toHaveTextContent("Kg");
  });

  it("flags out-of-stock and low-stock items separately", async () => {
    mount(<Product />);
    await screen.findByText("Potato");

    // Waffer is at zero.
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    // Potato (9 against the shop default of 10) and Chilli (1.86 against its
    // own limit of 5) are both low.
    expect(screen.getAllByText("Low stock")).toHaveLength(2);
    expect(screen.queryByText("In stock")).not.toBeInTheDocument();
  });

  it("filters to low stock on demand", async () => {
    mount(<Product />);
    await screen.findByText("Potato");

    fireEvent.click(screen.getByRole("button", { name: /^Low stock/ }));
    await waitFor(() => expect(screen.queryByText("Waffer")).not.toBeInTheDocument());
    expect(screen.getByText("Potato")).toBeInTheDocument();
    expect(screen.getByText("Chilli")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Out of stock/ }));
    await waitFor(() => expect(screen.queryByText("Potato")).not.toBeInTheDocument());
    expect(screen.getByText("Waffer")).toBeInTheDocument();
  });

  it("searches by name", async () => {
    mount(<Product />);
    await screen.findByText("Potato");
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "waf" },
    });
    await waitFor(() => expect(screen.queryByText("Potato")).not.toBeInTheDocument());
    expect(screen.getByText("Waffer")).toBeInTheDocument();
  });
});

describe("Customer screen", () => {
  it("lists customers without a blank row", async () => {
    mount(<Customer />);
    expect(await screen.findByText("Jay")).toBeInTheDocument();

    const bodyRows = screen
      .getAllByRole("row")
      .filter((row) => row.closest("tbody"));
    // Exactly the two customers, no empty placeholder row.
    expect(bodyRows).toHaveLength(2);
    bodyRows.forEach((row) => expect(row.textContent.trim()).not.toBe(""));
  });

  it("searches by phone number", async () => {
    mount(<Customer />);
    await screen.findByText("Jay");
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: "9812" },
    });
    await waitFor(() => expect(screen.queryByText("Jay")).not.toBeInTheDocument());
    expect(screen.getByText("Abhi")).toBeInTheDocument();
  });
});

describe("Orders screen", () => {
  it("lists orders and highlights an unpaid balance", async () => {
    mount(<Orders />);
    expect(await screen.findByText("DT_1")).toBeInTheDocument();
    const pendingRow = screen.getByText("DT_2").closest("tr");
    expect(pendingRow).toHaveTextContent("Pending");
    expect(pendingRow).toHaveTextContent("100.00");
  });

  it("returns stock when an order is deleted", async () => {
    mount(<Orders />);
    await screen.findByText("DT_1");

    const row = screen.getByText("DT_1").closest("tr");
    fireEvent.click(within(row).getByRole("button", { name: /delete/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^Delete$/ }));

    await waitFor(() =>
      expect(calls.some((c) => c.method === "DELETE" && c.url === "/orders/o1")).toBe(true)
    );
    // Potato had 9 Kg; the deleted bill had 2 Kg, so stock goes back to 11.
    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH" && c.url === "/product/p1");
      expect(patch?.payload?.stock).toBe("11.000");
    });
  });

  it("expands a row to show its line items", async () => {
    mount(<Orders />);
    await screen.findByText("DT_1");
    fireEvent.click(screen.getByText("DT_1").closest("tr"));
    expect(await screen.findByText("Potato")).toBeInTheDocument();
  });
});

describe("Reports screen", () => {
  it("shows sales, profit and outstanding figures", async () => {
    mount(<Reports />);
    expect(await screen.findByTestId("chart")).toBeInTheDocument();
    expect(screen.getByText("Total Sale")).toBeInTheDocument();
    expect(screen.getByText("Gross Profit")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
  });

  it("lists low stock items", async () => {
    mount(<Reports />);
    await screen.findByTestId("chart");
    expect(screen.getByText("Low Stock")).toBeInTheDocument();
  });
});

describe("Settings screen", () => {
  const openTab = (name) =>
    fireEvent.click(screen.getByRole("tab", { name }));

  it("persists the GST rate and low stock threshold", async () => {
    mount(<Settings />);
    openTab(/billing/i);

    fireEvent.change(screen.getByRole("spinbutton", { name: /gst rate/i }), {
      target: { value: "5" },
    });
    fireEvent.change(
      screen.getByRole("spinbutton", { name: /low stock threshold/i }),
      { target: { value: "25" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("shopSettings"));
      expect(stored.gstRate).toBe(5);
      expect(stored.lowStockThreshold).toBe(25);
    });
  });

  it("rejects a GST rate above 100", async () => {
    mount(<Settings />);
    openTab(/billing/i);

    fireEvent.change(screen.getByRole("spinbutton", { name: /gst rate/i }), {
      target: { value: "180" },
    });
    expect(await screen.findByText(/cannot be more than 100/i)).toBeInTheDocument();
  });

  it("shows the shop tab first and switches between tabs", async () => {
    mount(<Settings />);
    // Shop fields are visible, billing fields are not.
    expect(screen.getByRole("textbox", { name: /shop name/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("spinbutton", { name: /gst rate/i })
    ).not.toBeInTheDocument();

    openTab(/billing/i);
    expect(screen.getByRole("spinbutton", { name: /gst rate/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /shop name/i })
    ).not.toBeInTheDocument();
  });

  it("jumps to the tab holding an invalid value when saving", async () => {
    mount(<Settings />);
    openTab(/billing/i);
    fireEvent.change(screen.getByRole("spinbutton", { name: /gst rate/i }), {
      target: { value: "180" },
    });

    // Move away, then save: the bad field must be brought back into view.
    openTab(/shop details/i);
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }));

    await waitFor(() =>
      expect(screen.getByRole("spinbutton", { name: /gst rate/i })).toBeInTheDocument()
    );
    expect(localStorage.getItem("shopSettings")).toBeNull();
  });

  it("toggles a notification type and saves it immediately", async () => {
    mount(<Settings />);
    openTab(/notifications/i);

    fireEvent.click(screen.getByRole("checkbox", { name: /pending payments/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("shopSettings"));
      expect(stored.notifyPendingPayments).toBe(false);
    });
  });

  it("rejects a malformed shop GSTIN but allows it to be empty", async () => {
    mount(<Settings />);
    const gstin = screen.getByRole("textbox", { name: /gst number/i });

    fireEvent.change(gstin, { target: { value: "123" } });
    expect(await screen.findByText(/valid gstin/i)).toBeInTheDocument();

    fireEvent.change(gstin, { target: { value: "" } });
    await waitFor(() =>
      expect(screen.queryByText(/valid gstin/i)).not.toBeInTheDocument()
    );
  });
});
