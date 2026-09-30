import {
  LAST_BACKUP_KEY,
  backupDoneToday,
  backupFilename,
  msUntilHour,
  runBackup,
} from "./backup";
import { apiResponse } from "../api";

jest.mock("../api", () => ({ apiResponse: jest.fn() }));

const rows = {
  product: [{ id: "1", itemName: "Potato" }],
  venders: [{ id: "2", name: "Jay" }],
  orders: [{ id: "3", invoiceNo: "DT_1" }],
};

const ok = (endpoint) => ({
  success: true,
  data: rows[endpoint.replace("/", "")],
});

let clicks;

beforeEach(() => {
  localStorage.clear();
  clicks = [];
  apiResponse.mockImplementation((url) => Promise.resolve(ok(url)));

  global.URL.createObjectURL = jest.fn(() => "blob:test");
  global.URL.revokeObjectURL = jest.fn();
  // Capture the download instead of letting jsdom navigate.
  jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(function click() {
      clicks.push(this.download);
    });
});

afterEach(() => jest.restoreAllMocks());

describe("msUntilHour", () => {
  it("targets today when the hour is still ahead", () => {
    const from = new Date(2026, 0, 15, 8, 0, 0);
    expect(msUntilHour(10, from)).toBe(2 * 60 * 60 * 1000);
  });

  it("rolls over to tomorrow once the hour has passed", () => {
    const from = new Date(2026, 0, 15, 11, 0, 0);
    expect(msUntilHour(10, from)).toBe(23 * 60 * 60 * 1000);
  });

  it("rolls over when exactly on the hour, so it cannot fire twice", () => {
    const from = new Date(2026, 0, 15, 10, 0, 0);
    expect(msUntilHour(10, from)).toBe(24 * 60 * 60 * 1000);
  });
});

describe("runBackup", () => {
  it("downloads every collection with restore metadata", async () => {
    const result = await runBackup();
    expect(result.status).toBe("downloaded");
    expect(result.counts).toEqual({ product: 1, venders: 1, orders: 1 });
    expect(clicks).toHaveLength(1);
    expect(clicks[0]).toMatch(/^\d{4}-\d{2}-\d{2}_backup\.json$/);
  });

  it("records the date so it does not run twice in one day", async () => {
    await runBackup();
    expect(backupDoneToday()).toBe(true);

    const second = await runBackup();
    expect(second.status).toBe("already-done");
    expect(clicks).toHaveLength(1);
  });

  it("runs again on a new day", async () => {
    localStorage.setItem(LAST_BACKUP_KEY, "2020-01-01");
    const result = await runBackup();
    expect(result.status).toBe("downloaded");
  });

  it("force ignores the once-a-day guard for manual downloads", async () => {
    await runBackup();
    const forced = await runBackup({ force: true });
    expect(forced.status).toBe("downloaded");
    expect(clicks).toHaveLength(2);
  });

  it("does not mark the day as done when a collection fails", async () => {
    apiResponse.mockImplementation((url) =>
      url === "/orders"
        ? Promise.reject(new Error("network"))
        : Promise.resolve(ok(url))
    );
    await expect(runBackup()).rejects.toBeTruthy();
    expect(backupDoneToday()).toBe(false);
    expect(clicks).toHaveLength(0);
  });

  it("rejects a malformed response rather than saving an empty backup", async () => {
    apiResponse.mockResolvedValue({ success: true, data: null });
    await expect(runBackup()).rejects.toThrow();
    expect(backupDoneToday()).toBe(false);
  });
});

describe("backupFilename", () => {
  it("is date prefixed so files sort chronologically", () => {
    expect(backupFilename("2026-09-30")).toBe("2026-09-30_backup.json");
  });
});
