import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { apiResponse } from "../api";
import { onDataChanged } from "./dataEvents";
import {
  applyState,
  buildNotifications,
  notificationKey,
  readState,
  unreadCount,
  writeState,
} from "./notifications";
import useSettings from "./useSettings";

/** Background refresh, so a till left open still surfaces new alerts. */
const REFRESH_MS = 2 * 60 * 1000;

const useNotifications = () => {
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState(readState);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [orderRows, productRows] = await Promise.all([
        apiResponse("/orders", "GET"),
        apiResponse("/product", "GET"),
      ]);
      if (!mounted.current) return;
      setOrders(orderRows.data || []);
      setProducts(productRows.data || []);
    } catch {
      // A failed refresh just leaves the previous alerts in place; the bell is
      // not worth a toast of its own.
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const timer = setInterval(refresh, REFRESH_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    const offDataChanged = onDataChanged(refresh);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      offDataChanged();
    };
  }, [refresh]);

  const notifications = useMemo(
    () =>
      applyState(
        buildNotifications({ orders, products, settings, now: dayjs() }),
        state
      ),
    [orders, products, settings, state]
  );

  const persist = useCallback((next) => {
    writeState(next);
    setState(next);
  }, []);

  const markAllRead = useCallback(() => {
    const seen = new Set(state.seen);
    notifications.forEach((notification) => seen.add(notificationKey(notification)));
    persist({ ...state, seen: Array.from(seen) });
  }, [notifications, persist, state]);

  const dismiss = useCallback(
    (notification) => {
      const key = notificationKey(notification);
      persist({
        seen: Array.from(new Set([...state.seen, key])),
        dismissed: Array.from(new Set([...state.dismissed, key])),
      });
    },
    [persist, state]
  );

  const dismissAll = useCallback(() => {
    const keys = notifications.map(notificationKey);
    persist({
      seen: Array.from(new Set([...state.seen, ...keys])),
      dismissed: Array.from(new Set([...state.dismissed, ...keys])),
    });
  }, [notifications, persist, state]);

  return {
    notifications,
    unread: unreadCount(notifications),
    loading,
    refresh,
    markAllRead,
    dismiss,
    dismissAll,
  };
};

export default useNotifications;
