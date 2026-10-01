import { ThemeProvider } from "@emotion/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { I18nextProvider } from "react-i18next";

import i18n from "../../../i18n/i18n";
import theme from "../../../shared/theme";
import {
  MAX_ATTEMPTS,
  isPinSet,
  isUnlocked,
  setPin,
  verifyPin,
} from "../../../utils/auth";
import { AuthProvider } from "../../../utils/AuthContext";
import AuthGate from "../AuthGate";
import Lock from "../index";

const mount = (ui) =>
  render(
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </ThemeProvider>
  );

const pinField = () => document.querySelector('input[inputmode="numeric"]');

/** Type into the hidden field, the way a keypad or keyboard would. */
const type = (value) =>
  fireEvent.change(pinField(), { target: { value } });

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  await i18n.changeLanguage("en");
});

describe("the lock screen", () => {
  it("shows the shop's name and nothing to fill in but the PIN", () => {
    mount(<Lock mode="unlock" />);

    expect(screen.getByText("Enter PIN")).toBeInTheDocument();
    expect(screen.getByText("દેવાંગી ટોબેકો")).toBeInTheDocument();
    // No keypad, no other controls at all.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(document.querySelectorAll("input")).toHaveLength(1);
  });

  it("asks the phone for a number pad rather than a letter keyboard", () => {
    mount(<Lock mode="unlock" />);
    expect(pinField()).toHaveAttribute("inputmode", "numeric");
    expect(pinField()).toHaveAttribute("type", "password");
  });

  it("keeps the digits off the screen", () => {
    mount(<Lock mode="unlock" />);
    type("12");
    expect(screen.queryByText("12")).not.toBeInTheDocument();
  });

  it("ignores anything that is not a digit", async () => {
    await setPin("1234");
    const onUnlocked = jest.fn();
    mount(<Lock mode="unlock" onUnlocked={onUnlocked} />);

    type("12ab34");
    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
  });

  it("will not take more digits than the PIN is long", () => {
    mount(<Lock mode="unlock" />);
    type("123456");
    expect(pinField().value).toHaveLength(4);
  });
});

describe("unlocking", () => {
  beforeEach(async () => setPin("4821"));

  it("opens the till on the right PIN", async () => {
    const onUnlocked = jest.fn();
    mount(<Lock mode="unlock" onUnlocked={onUnlocked} />);
    type("4821");
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledTimes(1));
  });

  it("reports a wrong PIN and counts down the tries", async () => {
    const onUnlocked = jest.fn();
    mount(<Lock mode="unlock" onUnlocked={onUnlocked} />);
    type("1111");

    expect(
      await screen.findByText(`Wrong PIN — ${MAX_ATTEMPTS - 1} tries left`)
    ).toBeInTheDocument();
    expect(onUnlocked).not.toHaveBeenCalled();
  });

  it("clears the entry after a wrong try", async () => {
    mount(<Lock mode="unlock" />);
    type("1111");
    await waitFor(() => expect(pinField().value).toBe(""));
  });

  it("holds the field after too many wrong tries", async () => {
    mount(<Lock mode="unlock" />);

    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      type("1111");
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => expect(pinField().value).toBe(""));
    }

    expect(await screen.findByText(/try again in/i)).toBeInTheDocument();
    expect(pinField()).toBeDisabled();
  });
});

describe("first run", () => {
  it("asks for the PIN twice and saves it", async () => {
    const onPinSet = jest.fn();
    mount(<Lock mode="setup" onPinSet={onPinSet} />);

    expect(screen.getByText("Create a PIN")).toBeInTheDocument();
    type("2580");

    expect(await screen.findByText("Confirm PIN")).toBeInTheDocument();
    type("2580");

    await waitFor(() => expect(onPinSet).toHaveBeenCalled());
    expect(isPinSet()).toBe(true);
    expect(await verifyPin("2580")).toBe(true);
  });

  it("starts over when the two do not match", async () => {
    const onPinSet = jest.fn();
    mount(<Lock mode="setup" onPinSet={onPinSet} />);

    type("2580");
    await screen.findByText("Confirm PIN");
    type("1111");

    expect(await screen.findByText(/did not match/i)).toBeInTheDocument();
    expect(screen.getByText("Create a PIN")).toBeInTheDocument();
    expect(onPinSet).not.toHaveBeenCalled();
    expect(isPinSet()).toBe(false);
  });
});

describe("the gate", () => {
  const Till = () => <div>till is open</div>;

  const gate = () =>
    mount(
      <AuthProvider>
        <AuthGate>
          <Till />
        </AuthGate>
      </AuthProvider>
    );

  it("asks a new shopkeeper to choose a PIN before anything loads", () => {
    gate();
    expect(screen.getByText("Create a PIN")).toBeInTheDocument();
    expect(screen.queryByText("till is open")).not.toBeInTheDocument();
  });

  it("opens the till once the PIN is chosen", async () => {
    gate();
    type("1357");
    await screen.findByText("Confirm PIN");
    type("1357");

    expect(await screen.findByText("till is open")).toBeInTheDocument();
    expect(isUnlocked()).toBe(true);
  });

  it("asks for the PIN when one is already set", async () => {
    await setPin("4821");
    gate();

    expect(screen.getByText("Enter PIN")).toBeInTheDocument();
    expect(screen.queryByText("till is open")).not.toBeInTheDocument();

    type("4821");
    expect(await screen.findByText("till is open")).toBeInTheDocument();
  });

  it("stays open for the rest of the session", async () => {
    await setPin("4821");
    gate();
    type("4821");
    await screen.findByText("till is open");

    // A reload within the same session re-reads sessionStorage.
    gate();
    expect(screen.getAllByText("till is open").length).toBeGreaterThan(0);
  });
});
