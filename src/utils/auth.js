/**
 * PIN lock for the till.
 *
 * Scope, honestly: this keeps a passer-by at the counter out of the app while
 * the shopkeeper's back is turned. It is not protection against someone with
 * the device and intent — the data lives behind a public API and the browser
 * holds the PIN hash, so anyone who can open devtools can clear it. Treat it
 * as a counter lock, not account security.
 */

const PIN_KEY = "pinAuth";
const SESSION_KEY = "pinUnlocked";
const ATTEMPTS_KEY = "pinAttempts";

export const PIN_LENGTH = 4;

/** Enough to deter idle poking, short enough not to strand the shopkeeper. */
export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MS = 30_000;

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* A blocked store must not brick the till. */
  }
};

const remove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
};

const toHex = (buffer) =>
  [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const randomSalt = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return toHex(bytes);
};

/** Salted SHA-256, so the stored value is not the PIN itself. */
export const hashPin = async (pin, salt) => {
  const data = new TextEncoder().encode(`${salt}:${String(pin)}`);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
};

export const isPinSet = () => Boolean(read(PIN_KEY)?.hash);

export const setPin = async (pin) => {
  const salt = randomSalt();
  write(PIN_KEY, {
    salt,
    hash: await hashPin(pin, salt),
    updatedAt: new Date().toISOString(),
  });
  clearFailures();
};

export const verifyPin = async (pin) => {
  const stored = read(PIN_KEY);
  if (!stored?.hash) return false;
  return (await hashPin(pin, stored.salt)) === stored.hash;
};

/** Removes the PIN entirely, leaving the till open. */
export const clearPin = () => {
  remove(PIN_KEY);
  clearFailures();
};

/* ----------------------------------------------------------------- session */

/**
 * Unlocking lasts for the browser session, so a refresh mid-shift does not
 * demand the PIN again, but closing the app locks it.
 */
export const isUnlocked = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

export const unlock = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* no-op */
  }
  clearFailures();
};

export const lock = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* no-op */
  }
};

/* ------------------------------------------------------------ wrong tries */

const readAttempts = () => {
  const stored = read(ATTEMPTS_KEY);
  return {
    count: Number(stored?.count) || 0,
    until: Number(stored?.until) || 0,
  };
};

export const clearFailures = () => remove(ATTEMPTS_KEY);

/** Milliseconds left before another attempt is allowed; 0 when free. */
export const lockoutRemaining = (now = Date.now()) =>
  Math.max(readAttempts().until - now, 0);

/**
 * Record a wrong PIN. After MAX_ATTEMPTS the keypad is held for COOLDOWN_MS.
 * Attempts live in localStorage so reloading the page does not reset them.
 */
export const registerFailure = (now = Date.now()) => {
  const { count } = readAttempts();
  const next = count + 1;
  const locked = next >= MAX_ATTEMPTS;
  write(ATTEMPTS_KEY, {
    count: locked ? 0 : next,
    until: locked ? now + COOLDOWN_MS : 0,
  });
  return {
    attemptsLeft: locked ? MAX_ATTEMPTS : MAX_ATTEMPTS - next,
    lockedUntil: locked ? now + COOLDOWN_MS : 0,
  };
};

export const attemptsLeft = () =>
  Math.max(MAX_ATTEMPTS - readAttempts().count, 0);

/* ---------------------------------------------------------------- auto lock */

const ACTIVITY_KEY = "pinLastActivity";

/** Note that the shopkeeper is still here. */
export const touchActivity = (now = Date.now()) => {
  try {
    sessionStorage.setItem(ACTIVITY_KEY, String(now));
  } catch {
    /* no-op */
  }
};

/** Milliseconds since the last interaction; 0 when nothing recorded yet. */
export const idleMs = (now = Date.now()) => {
  try {
    const last = Number(sessionStorage.getItem(ACTIVITY_KEY));
    return last ? Math.max(now - last, 0) : 0;
  } catch {
    return 0;
  }
};

/**
 * Has the till been idle long enough to lock itself?
 * `minutes` of 0 (or less) means never.
 */
export const shouldAutoLock = (minutes, now = Date.now()) => {
  const limit = Number(minutes);
  if (!Number.isFinite(limit) || limit <= 0) return false;
  return idleMs(now) >= limit * 60_000;
};
