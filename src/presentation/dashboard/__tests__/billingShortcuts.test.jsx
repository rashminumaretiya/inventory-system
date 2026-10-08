import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import toast, { Toaster } from "react-hot-toast";
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
jest.mock("../print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p-waffer", itemName: "Waffer", price: "10", stock: "120.000", quantityCategory: "Pcs." },
];

const venders = [{ id: "v-jay", name: "Jay", phone: "9876543100", address: "" }];

// DT_1 and DT_3 exist, so the next bill is DT_4.
const orders = [
  { id: "o-1", invoiceNo: "DT_1", billingDate: "2026-10-01T00:00:00.000Z", total: "10" },
  { id: "o-3", invoiceNo: "DT_3", billingDate: "2026-10-03T00:00:00.000Z", total: "10" },
];

let posted;

/**
 * jsdom has no matchMedia, and the toaster asks it about reduced motion.
 * Nothing matches, so the desktop layout renders.
 */
const desktopMatchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

beforeAll(() => {
  window.matchMedia = desktopMatchMedia;
});

afterAll(() => {
  delete window.matchMedia;
});

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
            <Toaster />
            <Dashboard />
          </MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    </Provider>
  );
};

/** Loaded: the three requests answered and the next invoice number worked out. */
const ready = async () => {
  await waitFor(() => expect(apiResponse).toHaveBeenCalledTimes(3));
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: /invoice no/i })).toHaveValue("DT_4")
  );
};

const amount = (key) =>
  Number(screen.getByTestId(`summary-${key}`).textContent.replace(/[^0-9.-]/g, ""));

/** Type into a MUI Autocomplete and pick the matching option. */
const pickOption = async (label, text) => {
  fireEvent.change(screen.getByRole("combobox", { name: label }), {
    target: { value: text },
  });
  const option = await waitFor(() => {
    const match = screen.getAllByRole("option").find((node) => node.textContent.includes(text));
    if (!match) throw new Error(`no option for ${text}`);
    return match;
  });
  fireEvent.click(option);
};

/** Jay, and two Waffer: a bill ready to save. */
const fillBill = async () => {
  await pickOption(/customer name/i, "Jay");
  await pickOption(/item name/i, "Waffer");
  fireEvent.change(screen.getByRole("spinbutton", { name: /item quantity/i }), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: /add new/i }));
  await waitFor(() => expect(amount("subtotal")).toBe(20));
};

// Toasts live in a module-level store; one test's "saved" toast must not
// still be on screen in the next.
afterEach(() => {
  act(() => toast.remove());
});

beforeEach(async () => {
  localStorage.clear();
  posted = [];
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url, method, config, payload) => {
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: orders });
    }
    if (method === "POST") posted.push({ url, payload });
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

describe("keyboard", () => {
  it("F9 saves the bill", async () => {
    renderDashboard();
    await ready();
    await fillBill();

    await act(async () => {
      fireEvent.keyDown(window, { key: "F9" });
    });
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].payload.customerInfo.vendorName).toBe("Jay");
    expect(posted[0].payload.order[0].itemName).toBe("Waffer");
  });

  it("saves once however fast F9 is pressed twice", async () => {
    renderDashboard();
    await ready();
    await fillBill();

    fireEvent.keyDown(window, { key: "F9" });
    fireEvent.keyDown(window, { key: "F9" });

    await waitFor(() => expect(posted).toHaveLength(1));
    // Let anything still in flight land before counting again.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(posted).toHaveLength(1);
  });

  it("leaves the keys to an open dialog", async () => {
    renderDashboard();
    await ready();
    await fillBill();

    // "+ New" next to Customer Name opens the Add Customer dialog.
    fireEvent.click(screen.getAllByText("+ New")[0]);
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "F9" });

    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(posted).toHaveLength(0);
  });

  it("F2 and F4 jump to the item and customer fields", async () => {
    renderDashboard();
    await ready();

    fireEvent.keyDown(window, { key: "F2" });
    expect(screen.getByRole("combobox", { name: /item name/i })).toHaveFocus();
    fireEvent.keyDown(window, { key: "F4" });
    expect(screen.getByRole("combobox", { name: /customer name/i })).toHaveFocus();
  });
});

describe("after saving", () => {
  it("offers to send the bill on WhatsApp", async () => {
    const open = jest.spyOn(window, "open").mockImplementation(() => null);
    renderDashboard();
    await ready();
    await fillBill();

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    const send = await screen.findByRole("button", { name: "WhatsApp" });
    expect(screen.getByText("Invoice DT_4 saved")).toBeInTheDocument();
    fireEvent.click(send);

    const [url] = open.mock.calls[0];
    expect(url).toMatch(/^https:\/\/wa\.me\/919876543100\?text=/);
    const text = decodeURIComponent(url.split("text=")[1]);
    expect(text).toContain("Bill DT_4");
    expect(text).toContain("1. Waffer · 2 Pcs. · ₹20.00");
    open.mockRestore();
  });
});
