import dayjs from "dayjs";
import { apiResponse } from "../api";

/** Collections that make up a complete backup. */
export const BACKUP_ENDPOINTS = {
  product: "product",
  venders: "venders",
  orders: "orders",
};

export const LAST_BACKUP_KEY = "lastBackupDate";
const LOCK_KEY = "backupLock";
const LOCK_TTL_MS = 30_000;

export const BACKUP_VERSION = 1;

const today = () => dayjs().format("YYYY-MM-DD");

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode or a full quota must not break billing. */
  }
};

export const lastBackupDate = () => readStorage(LAST_BACKUP_KEY);

export const backupDoneToday = () => lastBackupDate() === today();

/**
 * Stops two open tabs from both downloading the same file. The lock is
 * timestamped so a crashed tab cannot block backups forever.
 */
const acquireLock = () => {
  const existing = Number(readStorage(LOCK_KEY));
  if (existing && Date.now() - existing < LOCK_TTL_MS) return false;
  writeStorage(LOCK_KEY, String(Date.now()));
  return true;
};

const releaseLock = () => {
  try {
    localStorage.removeItem(LOCK_KEY);
  } catch {
    /* no-op */
  }
};

/** Fetch every collection and wrap it with restore metadata. */
export const fetchBackupData = async () => {
  const entries = await Promise.all(
    Object.entries(BACKUP_ENDPOINTS).map(async ([key, endpoint]) => {
      const response = await apiResponse(`/${endpoint}`, "GET");
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(endpoint);
      }
      return [key, response.data];
    })
  );

  const data = Object.fromEntries(entries);

  return {
    // Metadata makes a backup file self-describing, so a restore can check
    // what it is looking at instead of guessing.
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    counts: Object.fromEntries(
      Object.entries(data).map(([key, rows]) => [key, rows.length])
    ),
    ...data,
  };
};

/** Trigger a browser download of `data` as pretty-printed JSON. */
export const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Freeing the blob immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

export const backupFilename = (date = today()) => `${date}_backup.json`;

/**
 * Run a backup.
 * @param {object} options
 * @param {boolean} options.force  ignore the once-per-day guard (manual runs)
 * @returns {Promise<{status: string, counts?: object}>}
 */
export const runBackup = async ({ force = false } = {}) => {
  const date = today();

  if (!force && backupDoneToday()) return { status: "already-done" };
  if (!force && !acquireLock()) return { status: "locked" };

  try {
    const data = await fetchBackupData();
    downloadJson(data, backupFilename(date));
    writeStorage(LAST_BACKUP_KEY, date);
    return { status: "downloaded", counts: data.counts };
  } finally {
    releaseLock();
  }
};

/**
 * Milliseconds until the next occurrence of `hour`:00 local time.
 * Recomputed per run rather than assuming a fixed 24h period, so the
 * schedule does not drift across a clock change.
 */
export const msUntilHour = (hour, from = new Date()) => {
  const target = new Date(from);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() <= from.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - from.getTime();
};
