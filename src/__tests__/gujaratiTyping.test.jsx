import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { apiResponse } from "../api";
import i18n from "../i18n/i18n";
import AddCustomer from "../presentation/dashboard/addCustomer";
import Dashboard from "../presentation/dashboard";
import Product from "../presentation/product";
import theme from "../shared/theme";
import customerReducer from "../store/slice/customerSlice";
import languageReducer from "../store/slice/languageSlice";
import orderReducer from "../store/slice/orderSlice";
import productReducer from "../store/slice/productSlice";
import { resetTypingMode } from "../utils/typingMode";

jest.mock("../api", () => ({ apiResponse: jest.fn() }));
jest.mock("../presentation/dashboard/print", () => ({
  Print: () => ({ generateReceipt: jest.fn(), downloadReceipt: jest.fn() }),
}));

const products = [
  { id: "p1", itemName: "Potato", price: "11", stock: "9.000", quantityCategory: "Kg" },
  { id: "p2", itemName: "ધાણાદાળ", price: "10", stock: "71.000", quantityCategory: "Kg" },
];
const venders = [{ id: "v1", name: "Jay", phone: "9876543100", address: "" }];

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

/**
 * Type the way a keyboard does: `beforeinput` per key, and the browser's own
 * insertion when nothing cancels it (through the native setter, as a browser
 * does, so React notices).
 */
const typeInto = (el, text) => {
  el.focus();
  [...text].forEach((key) => {
    const event = new InputEvent("beforeinput", {
      inputType: "insertText",
      data: key,
      cancelable: true,
      bubbles: true,
    });
    act(() => {
      el.dispatchEvent(event);
    });
    if (event.defaultPrevented) return;
    const at = el.selectionStart ?? el.value.length;
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el),
      "value"
    ).set;
    act(() => {
      setter.call(el, el.value.slice(0, at) + key + el.value.slice(at));
      el.setSelectionRange(at + 1, at + 1);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
};

beforeEach(async () => {
  localStorage.clear();
  resetTypingMode();
  apiResponse.mockImplementation((url, method, config, payload) => {
    if (method === "GET") {
      if (url === "/product") return Promise.resolve({ success: true, data: products });
      if (url === "/venders") return Promise.resolve({ success: true, data: venders });
      if (url === "/orders") return Promise.resolve({ success: true, data: [] });
    }
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
  await act(() => i18n.changeLanguage("gu"));
});

afterAll(async () => {
  await i18n.changeLanguage("en");
});

const ready = () => waitFor(() => expect(apiResponse).toHaveBeenCalledTimes(3));

describe("billing in Gujarati", () => {
  it("types the customer's name in Gujarati", async () => {
    mount(<Dashboard />);
    await ready();

    const customer = screen.getByRole("combobox", { name: /ગ્રાહકનું નામ/ });
    typeInto(customer, "ramesh");

    await waitFor(() => expect(customer).toHaveValue("રમેશ"));
  });

  it("shows the switch inside the field, set to Gujarati", async () => {
    mount(<Dashboard />);
    await ready();

    const toggles = screen.getAllByRole("button", { name: /ટાઇપિંગ બદલો/ });
    expect(toggles.length).toBeGreaterThan(0);
    expect(toggles[0]).toHaveTextContent("અ");
    expect(toggles[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("types English after the switch is flipped", async () => {
    mount(<Dashboard />);
    await ready();

    fireEvent.click(screen.getAllByRole("button", { name: /ટાઇપિંગ બદલો/ })[0]);
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /ટાઇપિંગ બદલો/ })[0]).toHaveTextContent("A")
    );

    const customer = screen.getByRole("combobox", { name: /ગ્રાહકનું નામ/ });
    typeInto(customer, "Jay");
    await waitFor(() => expect(customer).toHaveValue("Jay"));
  });

  it("remembers the switch", async () => {
    mount(<Dashboard />);
    await ready();
    fireEvent.click(screen.getAllByRole("button", { name: /ટાઇપિંગ બદલો/ })[0]);
    expect(localStorage.getItem("typingMode")).toBe("en");
  });

  it("leaves the phone number field alone", async () => {
    mount(<Dashboard />);
    await ready();

    const phone = screen.getByRole("textbox", { name: /ફોન નંબર/ });
    typeInto(phone, "9876543100");
    await waitFor(() => expect(phone).toHaveValue("9876543100"));
  });

  it("finds an English product when the item is typed in Gujarati", async () => {
    mount(<Dashboard />);
    await ready();

    const item = screen.getByRole("combobox", { name: /આઇટમનું નામ/ });
    typeInto(item, "pot");
    await waitFor(() => expect(item).toHaveValue("પોત"));

    const option = await screen.findByRole("option", { name: /Potato/ });
    expect(option).toBeInTheDocument();
  });

  it("still finds a Gujarati product", async () => {
    mount(<Dashboard />);
    await ready();

    const item = screen.getByRole("combobox", { name: /આઇટમનું નામ/ });
    typeInto(item, "dhaaNaa");
    expect(await screen.findByRole("option", { name: /ધાણાદાળ/ })).toBeInTheDocument();
  });
});

describe("other screens in Gujarati", () => {
  it("types a new customer's name in Gujarati", async () => {
    mount(<AddCustomer />);
    const name = screen.getByRole("textbox", { name: /ગ્રાહકનું નામ/ });
    typeInto(name, "bhaavin");
    await waitFor(() => expect(name).toHaveValue("ભાવિન"));
  });

  it("product search typed in Gujarati still finds English names", async () => {
    mount(<Product />);
    expect(await screen.findByText("Potato")).toBeInTheDocument();

    const search = screen.getByPlaceholderText(/શોધો/);
    typeInto(search, "pot");

    await waitFor(() => expect(search).toHaveValue("પોત"));
    expect(screen.getByText("Potato")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("ધાણાદાળ")).not.toBeInTheDocument());
  });
});

describe("in English", () => {
  it("types English and shows no switch", async () => {
    await act(() => i18n.changeLanguage("en"));
    mount(<Dashboard />);
    await ready();

    expect(screen.queryByRole("button", { name: /switch typing/i })).not.toBeInTheDocument();
    const customer = screen.getByRole("combobox", { name: /customer name/i });
    typeInto(customer, "ramesh");
    await waitFor(() => expect(customer).toHaveValue("ramesh"));
  });
});
