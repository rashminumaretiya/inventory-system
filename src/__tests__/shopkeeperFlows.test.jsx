import { ThemeProvider } from "@emotion/react";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

import { apiResponse } from "../api";
import i18n from "../i18n/i18n";
import CollectPayment from "../presentation/orders/collectPayment";
import StockIn from "../presentation/product/stockIn";
import theme from "../shared/theme";
import customerReducer from "../store/slice/customerSlice";
import languageReducer from "../store/slice/languageSlice";
import orderReducer from "../store/slice/orderSlice";
import productReducer from "../store/slice/productSlice";

jest.mock("../api", () => ({ apiResponse: jest.fn() }));

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
    return Promise.resolve({ success: true, data: payload ?? {} });
  });
});

describe("Stock In", () => {
  const potato = {
    id: "p1",
    itemName: "Potato",
    price: "11",
    costPrice: "8",
    stock: "9.000",
    quantityCategory: "Kg",
  };

  it("shows what is on the shelf and previews the new total", async () => {
    mount(<StockIn product={potato} />);
    expect(screen.getByText(/on the shelf now: 9 kg/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("spinbutton", { name: /received quantity/i }), {
      target: { value: "5" },
    });
    await waitFor(() => expect(screen.getByText("14 Kg")).toBeInTheDocument());
  });

  it("adds to the existing stock rather than replacing it", async () => {
    mount(<StockIn product={potato} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /received quantity/i }), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add stock/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({ url: "/product/p1", method: "PATCH" });
    expect(calls[0].payload.stock).toBe("14.000");
  });

  it("converts grams before adding", async () => {
    const chilli = { ...potato, id: "p3", itemName: "Chilli", stock: "1.860" };
    mount(<StockIn product={chilli} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: /received quantity/i }), {
      target: { value: "500" },
    });
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /unit/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Grams" }));
    fireEvent.click(screen.getByRole("button", { name: /add stock/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].payload.stock).toBe("2.360");
  });

  it("updates the cost price when the buying price changed", async () => {
    mount(<StockIn product={potato} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /received quantity/i }), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: /cost price/i }), {
      target: { value: "9.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add stock/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].payload.costPrice).toBe("9.5");
  });

  it("refuses a zero or empty quantity", async () => {
    mount(<StockIn product={potato} />);
    fireEvent.click(screen.getByRole("button", { name: /add stock/i }));

    expect(await screen.findByText(/please enter/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("offers only pieces for a counted item", async () => {
    const waffer = { ...potato, id: "p2", itemName: "Waffer", quantityCategory: "Pcs." };
    mount(<StockIn product={waffer} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /unit/i }));
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Pcs."])
    );
  });
});

describe("Collect Payment", () => {
  const bill = (over) => ({
    total: "0.00",
    payment: "Pending",
    amountPaid: 0,
    customerInfo: { vendorName: "Jay", vendorPhone: "9876543100" },
    ...over,
  });

  const orders = [
    bill({ id: "a", invoiceNo: "DT_1", billingDate: "2026-09-01", total: "500.00", balanceDue: 500 }),
    bill({ id: "b", invoiceNo: "DT_2", billingDate: "2026-09-20", total: "300.00", balanceDue: 300 }),
  ];

  it("shows the total owed and defaults to paying it all", () => {
    mount(<CollectPayment customerName="Jay" orders={orders} />);
    expect(screen.getByText("₹800.00")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: /amount received/i })).toHaveValue(800);
  });

  it("previews which bills a part payment clears, oldest first", async () => {
    mount(<CollectPayment customerName="Jay" orders={orders} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount received/i }), {
      target: { value: "650" },
    });

    await waitFor(() => expect(screen.getByText("DT_1")).toBeInTheDocument());
    expect(screen.getByText("DT_2")).toBeInTheDocument();
    expect(screen.getByText(/settled/i)).toBeInTheDocument();
    expect(screen.getByText(/₹150.00 still due/i)).toBeInTheDocument();
  });

  it("writes the allocation to each bill", async () => {
    mount(<CollectPayment customerName="Jay" orders={orders} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount received/i }), {
      target: { value: "650" },
    });
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));

    await waitFor(() => expect(calls).toHaveLength(2));

    const first = calls.find((c) => c.url === "/orders/a");
    expect(first.payload.balanceDue).toBe(0);
    expect(first.payload.amountPaid).toBe(500);
    // A fully paid bill stops being Pending.
    expect(first.payload.payment).toBe("Cash");
    expect(first.payload.payments).toHaveLength(1);

    const second = calls.find((c) => c.url === "/orders/b");
    expect(second.payload.balanceDue).toBe(150);
    expect(second.payload.payment).toBe("Pending");
  });

  it("records the chosen payment mode", async () => {
    mount(<CollectPayment customerName="Jay" orders={[orders[0]]} />);
    fireEvent.mouseDown(screen.getByRole("combobox", { name: /payment/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Online" }));
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].payload.payments[0].mode).toBe("Online");
    expect(calls[0].payload.payment).toBe("Online");
  });

  it("refuses more than is owed", async () => {
    mount(<CollectPayment customerName="Jay" orders={orders} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /amount received/i }), {
      target: { value: "1000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));

    expect(await screen.findByText(/more than the 800.00 owed/i)).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it("leaves settled bills alone", async () => {
    const mixed = [
      orders[0],
      bill({ id: "c", invoiceNo: "DT_3", billingDate: "2026-09-10", total: "200.00", balanceDue: 0, payment: "Cash" }),
    ];
    mount(<CollectPayment customerName="Jay" orders={mixed} />);
    fireEvent.click(screen.getByRole("button", { name: /record payment/i }));

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0].url).toBe("/orders/a");
  });
});
