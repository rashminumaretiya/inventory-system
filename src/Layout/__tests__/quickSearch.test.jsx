import { ThemeProvider } from "@emotion/react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React, { useState } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, useLocation } from "react-router-dom";

import { apiResponse } from "../../api";
import i18n from "../../i18n/i18n";
import theme from "../../shared/theme";
import NotificationsContext from "../../utils/NotificationsContext";
import { resetTypingMode } from "../../utils/typingMode";
import QuickSearch from "../QuickSearch";

jest.mock("../../api", () => ({ apiResponse: jest.fn() }));

const products = [
  { id: "p1", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
  { id: "p2", itemName: "Waffer", price: "10", stock: "0.000", quantityCategory: "Pcs." },
];

const venders = [
  { id: "v1", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
  { id: "v2", name: "Abhi", phone: "9812121212", address: "" },
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
];

/** Shows where the app went, so a test can read it. */
const Where = () => {
  const location = useLocation();
  return (
    <div data-testid="where">
      {location.pathname} {JSON.stringify(location.state)}
    </div>
  );
};

const Harness = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <QuickSearch open={open} onClose={() => setOpen(false)} />
      <span data-testid="open">{String(open)}</span>
    </>
  );
};

const mount = () =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={["/"]}>
          <NotificationsContext.Provider
            value={{ notifications: [], orders, products }}
          >
            <Harness />
            <Where />
          </NotificationsContext.Provider>
        </MemoryRouter>
      </I18nextProvider>
    </ThemeProvider>
  );

const box = () => screen.getByRole("combobox");
const search = (text) => fireEvent.change(box(), { target: { value: text } });
const options = () => screen.queryAllByRole("option");
const where = () => screen.getByTestId("where").textContent;

beforeEach(async () => {
  localStorage.clear();
  resetTypingMode();
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url) =>
    Promise.resolve({ success: true, data: url === "/venders" ? venders : [] })
  );
});

afterAll(async () => {
  await i18n.changeLanguage("en");
});

describe("Quick Search", () => {
  it("offers the everyday actions before anything is typed", () => {
    mount();
    const names = options().map((option) => option.textContent);
    expect(names).toEqual(
      expect.arrayContaining([
        "New bill",
        "Collect payments — unpaid bills",
        "Items running low",
        "Download a backup now",
        "Lock the till",
      ])
    );
  });

  it("finds an item with its stock and price", () => {
    mount();
    search("pot");
    const potato = screen.getByRole("option", { name: /potato/i });
    expect(potato).toHaveTextContent("9 Kg in stock · ₹11.00/Kg");
  });

  it("flags an item that has run out", () => {
    mount();
    search("waf");
    expect(screen.getByRole("option", { name: /waffer/i })).toHaveTextContent(
      "Out of stock"
    );
  });

  it("shows what a customer owes, and their unpaid bill", async () => {
    mount();
    search("jay");
    const jay = await screen.findByRole("option", { name: /^jay/i });
    expect(jay).toHaveTextContent("Due ₹500.00");
    expect(screen.getByRole("option", { name: /DT_1/ })).toHaveTextContent("Due ₹500.00");
  });

  it("opens the highlighted result on Enter", () => {
    mount();
    search("pot");
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(where()).toBe('/product {"search":"Potato"}');
    expect(screen.getByTestId("open")).toHaveTextContent("false");
  });

  it("moves through results with the arrow keys", async () => {
    mount();
    search("jay");
    await screen.findByRole("option", { name: /^jay/i });

    expect(options()[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(box(), { key: "ArrowDown" });
    expect(options()[1]).toHaveAttribute("aria-selected", "true");
    expect(box()).toHaveAttribute("aria-activedescendant", options()[1].id);

    fireEvent.keyDown(box(), { key: "Enter" });
    expect(where()).toBe('/orders {"search":"DT_1"}');
  });

  it("runs an action, e.g. straight to the unpaid bills", () => {
    mount();
    search("collect");
    fireEvent.click(screen.getByRole("option", { name: /collect payments/i }));
    expect(where()).toBe('/orders {"unpaidOnly":true}');
  });

  it("says so when nothing matches", () => {
    mount();
    search("zzz");
    expect(options()).toHaveLength(0);
    expect(screen.getByText("Nothing matches “zzz”")).toBeInTheDocument();
  });

  it("finds an action by its English name while the app is in Gujarati", async () => {
    await act(() => i18n.changeLanguage("gu"));
    mount();
    search("bill");
    expect(screen.getByRole("option", { name: "નવું બિલ" })).toBeInTheDocument();
  });

  it("types Gujarati in Gujarati mode and still finds English items", async () => {
    await act(() => i18n.changeLanguage("gu"));
    mount();

    const input = box();
    input.focus();
    [..."pot"].forEach((key) => {
      const event = new InputEvent("beforeinput", {
        inputType: "insertText",
        data: key,
        cancelable: true,
        bubbles: true,
      });
      act(() => {
        input.dispatchEvent(event);
      });
    });

    await waitFor(() => expect(input).toHaveValue("પોત"));
    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByRole("option", { name: /potato/i })).toBeInTheDocument();
  });
});
