import { ThemeProvider } from "@emotion/react";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, useLocation } from "react-router-dom";

import i18n from "../../i18n/i18n";
import theme from "../../shared/theme";
import NotificationsContext from "../../utils/NotificationsContext";
import Sidebar from "../Sidebar";

jest.mock("../../api", () => ({ apiResponse: jest.fn() }));

const today = new Date();
const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

const orders = [
  { id: "o1", invoiceNo: "DT_1", billingDate: today.toISOString(), total: "100.00", balanceDue: 0 },
  { id: "o2", invoiceNo: "DT_2", billingDate: today.toISOString(), total: "50.50", balanceDue: 20 },
  // Not today, but still owed.
  { id: "o3", invoiceNo: "DT_3", billingDate: lastWeek.toISOString(), total: "480.00", balanceDue: 480 },
];

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const mount = ({ path = "/orders", onOpenSearch = jest.fn() } = {}) =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[path]}>
          <NotificationsContext.Provider value={{ notifications: [], orders, products: [] }}>
            <Sidebar onOpenSearch={onOpenSearch} />
            <Where />
          </NotificationsContext.Provider>
        </MemoryRouter>
      </I18nextProvider>
    </ThemeProvider>
  );

beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
});

describe("sidebar", () => {
  it("gives every menu its own icon tile and marks the current page", () => {
    const { container } = mount({ path: "/orders" });

    expect(container.querySelectorAll(".nav-icon")).toHaveLength(6);
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Billing" })).not.toHaveAttribute("aria-current");
  });

  it("opens Quick Search from the search box", () => {
    const onOpenSearch = jest.fn();
    mount({ onOpenSearch });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(onOpenSearch).toHaveBeenCalled();
  });

  it("shows today's takings and everything still to collect", () => {
    mount();
    const card = screen.getByTestId("today-card");
    expect(card).toHaveTextContent("Today's Sale");
    expect(card).toHaveTextContent("2 bill(s)");
    expect(card).toHaveTextContent("₹150.50");
    expect(card).toHaveTextContent("To collect: ₹500.00");
  });

  it("opens the reports from the Today card", () => {
    mount({ path: "/" });
    fireEvent.click(screen.getByTestId("today-card"));
    expect(screen.getByTestId("where")).toHaveTextContent("/reports");
  });
});
