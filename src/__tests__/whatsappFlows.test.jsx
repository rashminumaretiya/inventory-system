import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { apiResponse } from "../api";
import i18n from "../i18n/i18n";
import NotificationBell from "../Layout/NotificationBell";
import Customer from "../presentation/customer";
import Orders from "../presentation/orders";
import theme from "../shared/theme";
import customerReducer from "../store/slice/customerSlice";
import languageReducer from "../store/slice/languageSlice";
import orderReducer from "../store/slice/orderSlice";
import productReducer from "../store/slice/productSlice";
import { NotificationsProvider } from "../utils/NotificationsContext";

jest.mock("../api", () => ({ apiResponse: jest.fn() }));
jest.mock("../presentation/dashboard/print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p1", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
];

const venders = [
  { id: "v1", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
  { id: "v2", name: "Abhi", phone: "9812121212", address: "" },
];

const orders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2026-08-25T00:00:00.000Z",
    subtotal: 22,
    total: "22.00",
    payment: "Cash",
    amountPaid: 22,
    balanceDue: 0,
    GSTAmount: 0,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
    order: [{ id: "p1", itemName: "Potato", price: "11", itemQuantity: "2", quantityCategory: "Kg" }],
  },
  {
    id: "o2",
    invoiceNo: "DT_2",
    billingDate: "2026-09-01T00:00:00.000Z",
    subtotal: 100,
    total: "100.00",
    payment: "Pending",
    amountPaid: 0,
    balanceDue: 100,
    GSTAmount: 0,
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212" },
    order: [{ id: "p1", itemName: "Potato", price: "10", itemQuantity: "10", quantityCategory: "Kg" }],
  },
];

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

/** The text WhatsApp was opened with, and who it was addressed to. */
const sentMessage = (open) => {
  const [url] = open.mock.calls[open.mock.calls.length - 1];
  const [address, query] = url.split("?text=");
  return { to: address.replace("https://wa.me/", ""), text: decodeURIComponent(query) };
};

let open;

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
  open = jest.spyOn(window, "open").mockImplementation(() => null);
  apiResponse.mockImplementation((url, method, config, payload) => {
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: orders });
    }
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

afterEach(() => open.mockRestore());

describe("Orders: share a bill", () => {
  it("sends the bill to that customer's WhatsApp", async () => {
    mount(<Orders />);
    const row = (await screen.findByText("DT_2")).closest("tr");

    fireEvent.click(within(row).getByRole("button", { name: "Share on WhatsApp" }));

    const { to, text } = sentMessage(open);
    expect(to).toBe("919812121212");
    expect(text).toContain("Bill DT_2 · 01/09/2026");
    expect(text).toContain("1. Potato · 10 Kg · ₹100.00");
    expect(text).toContain("*Balance Due: ₹100.00*");
  });
});

describe("Customers: dues and reminders", () => {
  const rowOf = async (name) => (await screen.findByText(name)).closest("tr");

  it("shows what each customer owes", async () => {
    mount(<Customer />);
    const abhi = await rowOf("Abhi");
    await waitFor(() => expect(abhi).toHaveTextContent("₹100.00"));
    expect(await rowOf("Jay")).toHaveTextContent("—");
  });

  it("filters to the customers who owe money", async () => {
    mount(<Customer />);
    await rowOf("Jay");

    fireEvent.click(await screen.findByRole("button", { name: "With dues 1 · ₹100.00" }));

    await waitFor(() => expect(screen.queryByText("Jay")).not.toBeInTheDocument());
    expect(screen.getByText("Abhi")).toBeInTheDocument();
  });

  it("offers Collect and Remind only where money is owed", async () => {
    mount(<Customer />);
    const jay = await rowOf("Jay");
    const abhi = await rowOf("Abhi");

    await waitFor(() =>
      expect(within(abhi).getByRole("button", { name: "Remind on WhatsApp" })).toBeInTheDocument()
    );
    expect(within(abhi).getByRole("button", { name: "Collect Payment" })).toBeInTheDocument();
    expect(within(jay).queryByRole("button", { name: "Remind on WhatsApp" })).not.toBeInTheDocument();
    expect(within(jay).queryByRole("button", { name: "Collect Payment" })).not.toBeInTheDocument();
  });

  it("drafts a polite reminder with the amount owed", async () => {
    mount(<Customer />);
    const abhi = await rowOf("Abhi");

    fireEvent.click(await within(abhi).findByRole("button", { name: "Remind on WhatsApp" }));

    const { to, text } = sentMessage(open);
    expect(to).toBe("919812121212");
    expect(text).toContain("Namaste Abhi");
    expect(text).toContain("₹100.00 is pending on 1 bill(s)");
  });

  it("collects a payment from the customer list", async () => {
    mount(<Customer />);
    const abhi = await rowOf("Abhi");

    fireEvent.click(await within(abhi).findByRole("button", { name: "Collect Payment" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Abhi");
    expect(within(dialog).getByRole("button", { name: /record payment/i })).toBeInTheDocument();
  });
});

describe("Bell: remind from a pending-payment alert", () => {
  it("drafts the reminder without leaving the screen", async () => {
    render(
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter initialEntries={["/"]}>
            <NotificationsProvider>
              <NotificationBell />
              <Routes>
                <Route path="/" element={<div>home</div>} />
                <Route path="/orders" element={<div>orders screen</div>} />
              </Routes>
            </NotificationsProvider>
          </MemoryRouter>
        </I18nextProvider>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    const alert = await screen.findByTestId("notification-pending:9812121212");
    fireEvent.click(within(alert).getByRole("button", { name: "Remind on WhatsApp" }));

    const { to, text } = sentMessage(open);
    expect(to).toBe("919812121212");
    expect(text).toContain("Namaste Abhi");
    expect(text).toContain("₹100.00");
    expect(screen.getByText("home")).toBeInTheDocument();
  });
});
