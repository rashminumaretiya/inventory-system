/**
 * A nudge that products or orders changed, so anything showing derived data
 * (the notification bell, mainly) can refresh without prop-drilling or polling
 * aggressively.
 */
const EVENT = "inventoryDataChanged";

export const notifyDataChanged = () => {
  window.dispatchEvent(new Event(EVENT));
};

export const onDataChanged = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
