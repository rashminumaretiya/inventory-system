import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
jest.mock("../print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p-potato", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
];
const venders = [
  { id: "v-jay", name: "Jay", phone: "9876543100", address: "Bhavani circle" },
];

let posted;

/** jsdom has no matchMedia; report a phone-width screen so the phone layout renders. */
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

beforeEach(async () => {
  localStorage.clear();
  posted = [];
  await i18n.changeLanguage("en");
  apiResponse.mockImplementation((url, method, config, payload) => {
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: [] });
    }
    if (method === "POST") {
      posted.push({ url, payload });
      return Promise.resolve({ success: true, data: payload });
    }
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

const renderPhone = () => {
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

const ready = () => waitFor(() => expect(apiResponse).toHaveBeenCalledTimes(3));

const pickOption = async (label, text) => {
  const input = screen.getByRole("combobox", { name: label });
  fireEvent.change(input, { target: { value: text } });
  const option = await waitFor(() => {
    const match = screen
      .getAllByRole("option")
      .find((node) => node.textContent.includes(text));
    if (!match) throw new Error(`no option for ${text}`);
    return match;
  });
  fireEvent.click(option);
};

const addPotato = async () => {
  await pickOption(/item name/i, "Potato");
  fireEvent.change(screen.getByRole("spinbutton", { name: /qty/i }), {
    target: { value: "2" },
  });
  fireEvent.click(screen.getByRole("button", { name: /add new/i }));
  await waitFor(() =>
    expect(screen.getAllByText("Potato").length).toBeGreaterThan(0)
  );
};

const saveButton = () => screen.getByRole("button", { name: /^save$/i });
const billDetailsButton = () =>
  screen.getByRole("button", { name: /bill details/i });

describe("phone billing: customer name", () => {
  it("is on the main screen, not hidden in Bill Details", async () => {
    renderPhone();
    await ready();

    expect(screen.getByRole("combobox", { name: /customer name/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is marked as required", async () => {
    renderPhone();
    await ready();
    expect(screen.getByText("Customer Name *")).toBeInTheDocument();
  });

  it("is not repeated inside Bill Details", async () => {
    renderPhone();
    await ready();

    fireEvent.click(billDetailsButton());
    const sheet = await screen.findByRole("dialog");

    expect(
      within(sheet).queryByRole("combobox", { name: /customer name/i })
    ).not.toBeInTheDocument();
    // The optional details are still there.
    expect(within(sheet).getByRole("textbox", { name: /phone number/i })).toBeInTheDocument();
  });
});

describe("phone billing: saving", () => {
  it("shows why a bill without a customer will not save", async () => {
    renderPhone();
    await ready();
    await addPotato();

    fireEvent.click(saveButton());

    // The message is on the visible field, not inside a closed sheet.
    expect(await screen.findByText(/please enter customer name/i)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  it("saves once a customer is chosen", async () => {
    renderPhone();
    await ready();
    await addPotato();
    await pickOption(/customer name/i, "Jay");

    fireEvent.click(saveButton());

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].payload.customerInfo.vendorName).toBe("Jay");
  });

  it("opens Bill Details by itself when the problem is inside it", async () => {
    renderPhone();
    await ready();
    await addPotato();
    await pickOption(/customer name/i, "Jay");

    // A bad phone number entered in the sheet, which is then closed.
    fireEvent.click(billDetailsButton());
    const sheet = await screen.findByRole("dialog");
    fireEvent.change(within(sheet).getByRole("textbox", { name: /phone number/i }), {
      target: { value: "12345" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: /done/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    fireEvent.click(saveButton());

    const reopened = await screen.findByRole("dialog");
    expect(
      within(reopened).getByText(/fix the highlighted fields/i)
    ).toBeInTheDocument();
    expect(
      within(reopened).getByText(/valid 10 digit phone number/i)
    ).toBeInTheDocument();
    expect(posted).toHaveLength(0);
  });

  it("flags the Bill Details button while something inside it is wrong", async () => {
    renderPhone();
    await ready();

    expect(billDetailsButton()).not.toHaveClass("MuiButton-outlinedError");

    fireEvent.click(billDetailsButton());
    const sheet = await screen.findByRole("dialog");
    fireEvent.change(within(sheet).getByRole("textbox", { name: /phone number/i }), {
      target: { value: "12345" },
    });
    fireEvent.click(within(sheet).getByRole("button", { name: /done/i }));

    await waitFor(() =>
      expect(billDetailsButton()).toHaveClass("MuiButton-outlinedError")
    );
  });
});
