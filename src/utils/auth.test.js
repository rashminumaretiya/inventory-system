import {
  COOLDOWN_MS,
  MAX_ATTEMPTS,
  attemptsLeft,
  clearFailures,
  clearPin,
  hashPin,
  isPinSet,
  isUnlocked,
  lock,
  lockoutRemaining,
  randomSalt,
  registerFailure,
  setPin,
  shouldAutoLock,
  touchActivity,
  idleMs,
  unlock,
  verifyPin,
} from "./auth";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("setting a PIN", () => {
  it("reports whether one exists", async () => {
    expect(isPinSet()).toBe(false);
    await setPin("1234");
    expect(isPinSet()).toBe(true);
  });

  it("never stores the PIN itself", async () => {
    await setPin("1234");
    const raw = localStorage.getItem("pinAuth");
    expect(raw).not.toContain("1234");
    expect(JSON.parse(raw).hash).toHaveLength(64);
  });

  it("salts the hash, so the same PIN stores differently each time", async () => {
    await setPin("1234");
    const first = JSON.parse(localStorage.getItem("pinAuth"));
    await setPin("1234");
    const second = JSON.parse(localStorage.getItem("pinAuth"));
    expect(second.salt).not.toBe(first.salt);
    expect(second.hash).not.toBe(first.hash);
  });

  it("clears the PIN on request", async () => {
    await setPin("1234");
    clearPin();
    expect(isPinSet()).toBe(false);
  });
});

describe("verifying", () => {
  it("accepts the right PIN and rejects the wrong one", async () => {
    await setPin("4821");
    expect(await verifyPin("4821")).toBe(true);
    expect(await verifyPin("4822")).toBe(false);
    expect(await verifyPin("")).toBe(false);
  });

  it("rejects everything when no PIN is set", async () => {
    expect(await verifyPin("1234")).toBe(false);
  });

  it("hashes consistently for a given salt", async () => {
    const salt = randomSalt();
    expect(await hashPin("1234", salt)).toBe(await hashPin("1234", salt));
    expect(await hashPin("1234", salt)).not.toBe(await hashPin("1235", salt));
  });
});

describe("session lock", () => {
  it("starts locked and unlocks for the session", () => {
    expect(isUnlocked()).toBe(false);
    unlock();
    expect(isUnlocked()).toBe(true);
  });

  it("locks again on demand", () => {
    unlock();
    lock();
    expect(isUnlocked()).toBe(false);
  });

  it("keeps the unlock out of localStorage, so closing the app relocks", () => {
    unlock();
    expect(localStorage.getItem("pinUnlocked")).toBeNull();
    expect(sessionStorage.getItem("pinUnlocked")).toBe("1");
  });
});

describe("wrong attempts", () => {
  it("counts down the tries left", () => {
    expect(attemptsLeft()).toBe(MAX_ATTEMPTS);
    expect(registerFailure().attemptsLeft).toBe(MAX_ATTEMPTS - 1);
    expect(registerFailure().attemptsLeft).toBe(MAX_ATTEMPTS - 2);
  });

  it("holds the keypad after too many wrong tries", () => {
    const now = 1_000_000;
    let result;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) result = registerFailure(now);

    expect(result.lockedUntil).toBe(now + COOLDOWN_MS);
    expect(lockoutRemaining(now)).toBe(COOLDOWN_MS);
    expect(lockoutRemaining(now + COOLDOWN_MS)).toBe(0);
  });

  it("survives a page reload, so reloading is not a way past it", () => {
    const now = 1_000_000;
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) registerFailure(now);
    // localStorage is what a reload keeps.
    expect(JSON.parse(localStorage.getItem("pinAttempts")).until).toBe(
      now + COOLDOWN_MS
    );
  });

  it("resets the count once the right PIN goes in", () => {
    registerFailure();
    registerFailure();
    unlock();
    expect(attemptsLeft()).toBe(MAX_ATTEMPTS);
  });

  it("resets when a new PIN is set", async () => {
    registerFailure();
    await setPin("1111");
    expect(attemptsLeft()).toBe(MAX_ATTEMPTS);
  });

  it("can be cleared directly", () => {
    registerFailure();
    clearFailures();
    expect(attemptsLeft()).toBe(MAX_ATTEMPTS);
  });
});

describe("auto lock", () => {
  it("is off when no timeout is set", () => {
    touchActivity(1_000_000);
    expect(shouldAutoLock(0, 1_000_000 + 60 * 60_000)).toBe(false);
    expect(shouldAutoLock(undefined, 1_000_000 + 60 * 60_000)).toBe(false);
    expect(shouldAutoLock(-5, 1_000_000 + 60 * 60_000)).toBe(false);
  });

  it("locks once the idle time passes the limit", () => {
    const start = 1_000_000;
    touchActivity(start);

    expect(shouldAutoLock(10, start + 9 * 60_000)).toBe(false);
    expect(shouldAutoLock(10, start + 10 * 60_000)).toBe(true);
    expect(shouldAutoLock(10, start + 25 * 60_000)).toBe(true);
  });

  it("restarts the clock on activity", () => {
    const start = 1_000_000;
    touchActivity(start);
    expect(shouldAutoLock(10, start + 9 * 60_000)).toBe(false);

    touchActivity(start + 9 * 60_000);
    expect(shouldAutoLock(10, start + 15 * 60_000)).toBe(false);
    expect(shouldAutoLock(10, start + 19 * 60_000)).toBe(true);
  });

  it("measures the gap in milliseconds", () => {
    touchActivity(1_000_000);
    expect(idleMs(1_000_000 + 5_000)).toBe(5_000);
    expect(idleMs(900_000)).toBe(0);
  });

  it("keeps the activity stamp out of localStorage", () => {
    touchActivity();
    expect(localStorage.getItem("pinLastActivity")).toBeNull();
    expect(sessionStorage.getItem("pinLastActivity")).not.toBeNull();
  });
});
