import { ThemeProvider } from "@emotion/react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { apiResponse } from "../../api";
import i18n from "../../i18n/i18n";
import theme from "../../shared/theme";
import { NotificationsProvider } from "../../utils/NotificationsContext";
import NotificationBell from "../NotificationBell";

jest.mock("../../api", () => ({ apiResponse: jest.fn() }));

const products = [
  { id: "p1", itemName: "Potato", stock: "9.000", quantityCategory: "Kg" },
  { id: "p2", itemName: "Waffer", stock: "0.000", quantityCategory: "Pcs." },
  { id: "p3", itemName: "Banana", stock: "1964.000", quantityCategory: "Pcs." },
];

const orders = [
  {
    id: "o1",
    invoiceNo: "DT_1",
    billingDate: "2026-09-01T00:00:00.000Z",
    total: "500.00",
    payment: "Pending",
    balanceDue: 500,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
  },
  {
    id: "o2",
    invoiceNo: "DT_2",
    billingDate: "2026-09-20T00:00:00.000Z",
    total: "300.00",
    payment: "Cash",
    balanceDue: 0,
    customerInfo: { vendorName: "Abhi", vendorPhone: "9812121212" },
  },
];

const mount = () =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/"]}>
          <NotificationsProvider>
            <NotificationBell />
            <Routes>
              <Route path="/" element={<div>home</div>} />
              <Route path="/orders" element={<div>orders screen</div>} />
              <Route path="/product" element={<div>product screen</div>} />
              <Route path="/reports" element={<div>reports screen</div>} />
            </Routes>
          </NotificationsProvider>
        </MemoryRouter>
      </I18nextProvider>
    </ThemeProvider>
  );

const openBell = () =>
  fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url) => {
    if (url === "/orders") return Promise.resolve({ success: true, data: orders });
    if (url === "/product") return Promise.resolve({ success: true, data: products });
    return Promise.resolve({ success: true, data: [] });
  });
});

describe("notification bell", () => {
  it("badges the number of unread alerts", async () => {
    mount();
    // Jay owes money; Waffer is out of stock; Potato is below the default 10.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /notifications/i })).toHaveTextContent("3")
    );
  });

  it("lists pending payments and stock alerts together", async () => {
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    expect(await screen.findByText(/Jay owes money/i)).toBeInTheDocument();
    expect(screen.getByText(/₹500.00 outstanding across 1 bill/i)).toBeInTheDocument();
    expect(screen.getByText(/Waffer is out of stock/i)).toBeInTheDocument();
    expect(screen.getByText(/Potato is running low/i)).toBeInTheDocument();
  });

  it("leaves out customers who owe nothing", async () => {
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    await screen.findByText(/Jay owes money/i);
    expect(screen.queryByText(/Abhi/i)).not.toBeInTheDocument();
  });

  it("clears the badge once the panel has been opened", async () => {
    mount();
    const bell = () => screen.getByLabelText("Notifications", { selector: "button" });
    await waitFor(() => expect(bell()).toHaveTextContent("3"));

    openBell();
    await screen.findByText(/Jay owes money/i);

    // MUI marks the page behind a popover aria-hidden, so close it first.
    fireEvent.keyDown(document.activeElement || document.body, { key: "Escape" });

    await waitFor(() => expect(bell()).not.toHaveTextContent("3"));
  });

  it("takes you to the screen that resolves the alert", async () => {
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    fireEvent.click(await screen.findByText(/Jay owes money/i));
    expect(await screen.findByText("orders screen")).toBeInTheDocument();
  });

  it("dismisses a single alert", async () => {
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    await screen.findByText(/Waffer is out of stock/i);
    const row = screen.getByTestId("notification-stock:p2");
    fireEvent.click(within(row).getByRole("button", { name: /dismiss/i }));

    await waitFor(() =>
      expect(screen.queryByText(/Waffer is out of stock/i)).not.toBeInTheDocument()
    );
    // The others are untouched.
    expect(screen.getByText(/Jay owes money/i)).toBeInTheDocument();
  });

  it("clears every alert at once", async () => {
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();
    await screen.findByText(/Jay owes money/i);

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));
    expect(await screen.findByText(/nothing needs your attention/i)).toBeInTheDocument();
  });

  it("says so when there is nothing to report", async () => {
    apiResponse.mockImplementation((url) =>
      Promise.resolve({
        success: true,
        data: url === "/product" ? [products[2]] : [orders[1]],
      })
    );
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    expect(
      await screen.findByText(/nothing needs your attention/i)
    ).toBeInTheDocument();
  });

  it("respects the notification switches in settings", async () => {
    localStorage.setItem(
      "shopSettings",
      JSON.stringify({ notifyLowStock: false })
    );
    mount();
    await waitFor(() => expect(apiResponse).toHaveBeenCalled());
    openBell();

    expect(await screen.findByText(/Jay owes money/i)).toBeInTheDocument();
    expect(screen.queryByText(/out of stock/i)).not.toBeInTheDocument();
  });
});
