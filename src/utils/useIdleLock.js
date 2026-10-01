import { useEffect } from "react";

import { shouldAutoLock, touchActivity } from "./auth";

/** How often to check; fine enough that a 1-minute setting still feels right. */
const CHECK_MS = 10_000;

const ACTIVITY_EVENTS = [
  "pointerdown",
  "keydown",
  "wheel",
  "touchstart",
  "focus",
];

/**
 * Lock the till after `minutes` without interaction. A value of 0 disables it.
 *
 * Activity is written to sessionStorage rather than held in a ref, so coming
 * back to a backgrounded tab still sees how long it was really away.
 */
const useIdleLock = ({ enabled, minutes, onIdle }) => {
  useEffect(() => {
    if (!enabled || Number(minutes) <= 0) return undefined;

    touchActivity();

    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      // Throttle: a busy till would otherwise write on every keystroke.
      if (now - lastWrite < 1000) return;
      lastWrite = now;
      touchActivity(now);
    };

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true })
    );

    const check = () => {
      if (shouldAutoLock(minutes)) onIdle();
    };

    const timer = setInterval(check, CHECK_MS);

    // Returning to the tab is the moment a long absence shows up.
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
      else touchActivity();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, onActivity)
      );
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, minutes, onIdle]);
};

export default useIdleLock;
