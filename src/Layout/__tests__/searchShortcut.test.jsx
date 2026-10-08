import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import useSearchShortcut from "../useSearchShortcut";

const Harness = ({ onOpen }) => {
  useSearchShortcut(onOpen);
  return <input aria-label="customer" />;
};

describe("search shortcut", () => {
  it("opens on Ctrl+K and on ⌘K", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    fireEvent.keyDown(window, { key: "K", metaKey: true });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("opens on / when the cursor is not in a field", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);

    fireEvent.keyDown(document.body, { key: "/" });
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("leaves / to the field being typed in", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);

    fireEvent.keyDown(screen.getByRole("textbox", { name: "customer" }), { key: "/" });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("ignores a plain k", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);

    fireEvent.keyDown(document.body, { key: "k" });
    expect(onOpen).not.toHaveBeenCalled();
  });
});
