/** The in-progress bill, kept in localStorage so a refresh does not lose it. */
const CART_KEY = "formData";

export const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

export const writeCart = (lines) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    // Ignore quota errors; the bill still lives in React state.
  }
};

export const clearCart = () => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {
    /* no-op */
  }
};
