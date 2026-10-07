import { createContext, useContext } from "react";
import useNotifications from "./useNotifications";

const NotificationsContext = createContext(null);

/**
 * One notification engine for the whole app, so the bell and the sidebar
 * badges read the same data and only one poller runs.
 */
export const NotificationsProvider = ({ children }) => {
  const value = useNotifications();
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

const EMPTY = {
  notifications: [],
  unread: 0,
  loading: false,
  refresh: () => {},
  markAllRead: () => {},
  dismiss: () => {},
  dismissAll: () => {},
};

/** Falls back to an inert value so components render outside the provider. */
export const useNotificationsContext = () =>
  useContext(NotificationsContext) ?? EMPTY;

/** How many alerts of each type are live, for the sidebar badges. */
export const useAlertCounts = () => {
  const { notifications } = useNotificationsContext();
  return notifications.reduce(
    (counts, notification) => {
      if (notification.type === "pending") counts.orders += 1;
      else counts.product += 1;
      return counts;
    },
    { orders: 0, product: 0 },
  );
};

export default NotificationsContext;
