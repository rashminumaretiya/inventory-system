import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router-dom";

import { apiResponse } from "../../../api";
import i18n from "../../../i18n/i18n";
import theme from "../../../shared/theme";
import customerReducer from "../../../store/slice/customerSlice";
import languageReducer from "../../../store/slice/languageSlice";
import orderReducer from "../../../store/slice/orderSlice";
import productReducer from "../../../store/slice/productSlice";
import Orders from "../index";

jest.mock("../../../api", () => ({ apiResponse: jest.fn() }));

const mockGenerateReceipt = jest.fn();
const mockDownloadReceipt = jest.fn();
jest.mock("../../dashboard/print", () => ({
  Print: () => ({
    generateReceipt: mockGenerateReceipt,
    downloadReceipt: mockDownloadReceipt,
  }),
}));

const products = [
  { id: "p1", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
  { id: "p3", itemName: "Chilli", price: "200", stock: "5.000", quantityCategory: "Kg" },
];

const seedOrders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2026-08-25T10:30:00.000Z",
    subtotal: 22,
    total: "22.00",
    payment: "Cash",
    amountPaid: 22,
    balanceDue: 0,
    GSTAmount: 0,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100", address: "Bhavani circle" },
    order: [
      { id: "p1", itemName: "Potato", price: "11", itemQuantity: "2", quantityCategory: "Kg", subtotal: "22.00" },
    ],
  },
  {
    id: "o2",
    invoiceNo: "DT_2",
    billingDate: "2026-09-01T09:00:00.000Z",
    subtotal: 72,
    discountAmount: 2,
    GST: "yes",
    GSTRate: 18,
    GSTAmount: 12.6,
    GSTNumber: "24ABCDE1234F1Z5",
    total: "82.60",
    payment: "Pending",
    amountPaid: 50,
    balanceDue: 32.6,
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212", address: "" },
    order: [
      { id: "p1", itemName: "Potato", price: "11", itemQuantity: "2", quantityCategory: "Kg", subtotal: "22.00" },
      // Priced per Kg; 250 g of it is ₹50.
      { id: "p3", itemName: "Chilli", price: "200", itemQuantity: "250", quantityCategory: "Grams", subtotal: "50.00" },
    ],
    payments: [{ at: "2026-09-05T10:00:00.000Z", amount: 30, mode: "Cash" }],
  },
];

/** A tiny json-server: PATCH and DELETE change what the next GET returns. */
let db;
let calls;

const Where = () => {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
};

const mount = () => {
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
          <MemoryRouter initialEntries={["/orders"]}>
            <Orders />
            <Where />
          </MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
};

const rowOf = async (invoice) => (await screen.findByText(invoice)).closest("tr");

const openBill = async (invoice) => {
  fireEvent.click(await rowOf(invoice));
  return screen.findByRole("dialog", { name: new RegExp(invoice) });
};

beforeEach(async () => {
  localStorage.clear();
  mockGenerateReceipt.mockClear();
  mockDownloadReceipt.mockClear();
  db = JSON.parse(JSON.stringify(seedOrders));
  calls = [];
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url, method, config, payload) => {
    calls.push({ url, method, payload });
    if (method === "GET") {
      if (url === "/orders") return Promise.resolve({ success: true, data: db });
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      return Promise.resolve({ success: true, data: [] });
    }
    const [, collection, id] = url.split("/");
    if (collection === "orders" && method === "PATCH") {
      db = db.map((order) => (order.id === id ? { ...order, ...payload } : order));
    }
    if (collection === "orders" && method === "DELETE") {
      db = db.filter((order) => order.id !== id);
    }
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

describe("bill details drawer", () => {
  it("opens from a row with the customer, every line and the totals", async () => {
    mount();
    const drawer = await openBill("DT_2");

    expect(drawer).toHaveTextContent("Pending");
    expect(drawer).toHaveTextContent("01/09/2026");
    expect(drawer).toHaveTextContent("Abhi");
    expect(within(drawer).getByRole("link", { name: /9812121212/ })).toHaveAttribute(
      "href",
      "tel:9812121212"
    );
    expect(drawer).toHaveTextContent("GST Number: 24ABCDE1234F1Z5");

    const lines = within(drawer).getAllByTestId("order-line");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveTextContent("Potato2 Kg × ₹11.00/Kg₹22.00");
    expect(lines[1]).toHaveTextContent("Chilli250 Grams × ₹200.00/Kg₹50.00");

    expect(drawer).toHaveTextContent("Subtotal₹72.00");
    expect(drawer).toHaveTextContent("Discount Applied− ₹2.00");
    expect(drawer).toHaveTextContent("GST Amount (18%)₹12.60");
    expect(within(drawer).getByTestId("order-total")).toHaveTextContent("₹82.60");
    expect(drawer).toHaveTextContent("Amount Paid₹50.00");
    expect(within(drawer).getByTestId("order-balance")).toHaveTextContent("₹32.60");
    expect(drawer).toHaveTextContent("Payments received");
    expect(drawer).toHaveTextContent("05/09/2026 · Cash₹30.00");
  });

  it("says Paid in full and leaves out lines that would read zero", async () => {
    mount();
    const drawer = await openBill("DT_1");

    expect(drawer).toHaveTextContent("Paid in full");
    expect(drawer).not.toHaveTextContent("Discount Applied");
    expect(drawer).not.toHaveTextContent("GST Amount");
    expect(drawer).not.toHaveTextContent("Payments received");
    expect(within(drawer).queryByRole("button", { name: /collect payment/i })).not.toBeInTheDocument();
  });

  it("opens from the keyboard", async () => {
    mount();
    const row = await rowOf("DT_1");
    row.focus();
    fireEvent.keyDown(row, { key: "Enter" });
    expect(await screen.findByRole("dialog", { name: /DT_1/ })).toBeInTheDocument();
  });

  it("does not open when one of the row's own buttons is used", async () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    mount();
    const row = await rowOf("DT_1");

    fireEvent.click(within(row).getByRole("button", { name: "Share on WhatsApp" }));

    expect(open).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    open.mockRestore();
  });

  it("closes", async () => {
    mount();
    const drawer = await openBill("DT_1");
    fireEvent.click(within(drawer).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("prints, downloads and shares the bill it shows", async () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    mount();
    const drawer = await openBill("DT_2");

    fireEvent.click(within(drawer).getByRole("button", { name: "Print" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "Download" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "WhatsApp" }));

    expect(mockGenerateReceipt).toHaveBeenCalledWith(expect.objectContaining({ invoiceNo: "DT_2" }));
    expect(mockDownloadReceipt).toHaveBeenCalledWith(expect.objectContaining({ invoiceNo: "DT_2" }));
    expect(open.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/919812121212\?text=/);
    open.mockRestore();
  });

  it("opens the bill for editing", async () => {
    mount();
    const drawer = await openBill("DT_2");
    fireEvent.click(within(drawer).getByRole("button", { name: "Edit bill" }));
    expect(screen.getByTestId("where")).toHaveTextContent("/?order/o2");
  });

  it("collects what is owed and shows the bill paid straight away", async () => {
    mount();
    const drawer = await openBill("DT_2");

    fireEvent.click(within(drawer).getByRole("button", { name: "Collect Payment · ₹32.60" }));
    fireEvent.click(await screen.findByRole("button", { name: /record payment/i }));

    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /DT_2/ })).toHaveTextContent("Paid in full")
    );
    expect(calls.some((c) => c.method === "PATCH" && c.url === "/orders/o2")).toBe(true);
  });

  it("deletes the bill and closes", async () => {
    mount();
    const drawer = await openBill("DT_1");

    fireEvent.click(within(drawer).getByRole("button", { name: "Delete" }));
    const confirm = await screen.findByRole("dialog", { name: /are you sure/i });
    fireEvent.click(within(confirm).getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(calls.some((c) => c.method === "DELETE" && c.url === "/orders/o1")).toBe(true)
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /DT_1/ })).not.toBeInTheDocument()
    );
    expect(screen.queryByText("DT_1")).not.toBeInTheDocument();
  });
});

describe("on a phone", () => {
  /** jsdom has no matchMedia; report a phone-width screen. */
  const phoneMatchMedia = (query) => ({
    matches: /max-width/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });

  beforeAll(() => {
    window.matchMedia = phoneMatchMedia;
  });

  afterAll(() => {
    delete window.matchMedia;
  });

  it("opens the same drawer when a bill card is tapped", async () => {
    mount();
    fireEvent.click(await screen.findByText("DT_2"));

    const drawer = await screen.findByRole("dialog", { name: /DT_2/ });
    expect(within(drawer).getAllByTestId("order-line")).toHaveLength(2);
  });
});
