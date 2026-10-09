import { isUpiId, upiPaymentLink } from "./upi";

describe("isUpiId", () => {
  it("accepts the UPI IDs shops are given", () => {
    ["9876543210@ybl", "devangi.tobacco@okhdfcbank", "paytmqr2810050501011abc@paytm", " shop-1@upi "].forEach(
      (id) => expect(isUpiId(id)).toBe(true)
    );
  });

  it("rejects what is not one", () => {
    ["", "9876543210", "@ybl", "shop@", "shop@@ybl", "shop @ybl", "shop@1bank"].forEach((id) =>
      expect(isUpiId(id)).toBe(false)
    );
  });
});

describe("upiPaymentLink", () => {
  it("pays the shop the bill's amount, in rupees with paise", () => {
    expect(
      upiPaymentLink({ upiId: "9876543210@ybl", name: "Devangi Tobacco", amount: 1461, note: "Bill DT_7" })
    ).toBe("upi://pay?pa=9876543210@ybl&pn=Devangi%20Tobacco&am=1461.00&cu=INR&tn=Bill%20DT_7");
  });

  it("rounds the amount to paise and reads it from text", () => {
    expect(upiPaymentLink({ upiId: "shop@upi", amount: "82.605" })).toBe(
      "upi://pay?pa=shop@upi&am=82.61&cu=INR"
    );
  });

  it("leaves out a name or note that is not plain English text", () => {
    const link = upiPaymentLink({ upiId: "shop@upi", name: "દેવાંગી ટોબેકો", amount: 10, note: "બિલ" });
    expect(link).toBe("upi://pay?pa=shop@upi&am=10.00&cu=INR");
  });

  it("escapes characters that would break the link", () => {
    expect(upiPaymentLink({ upiId: "shop@upi", name: "Patel & Sons", amount: 5 })).toBe(
      "upi://pay?pa=shop@upi&pn=Patel%20%26%20Sons&am=5.00&cu=INR"
    );
  });

  it("gives no link without a valid UPI ID or an amount to pay", () => {
    expect(upiPaymentLink({ upiId: "", amount: 100 })).toBe("");
    expect(upiPaymentLink({ upiId: "not-an-id", amount: 100 })).toBe("");
    expect(upiPaymentLink({ upiId: "shop@upi", amount: 0 })).toBe("");
    expect(upiPaymentLink({ upiId: "shop@upi", amount: -5 })).toBe("");
  });
});
