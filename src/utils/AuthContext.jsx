import { createContext, useCallback, useContext, useState } from "react";

import {
  isPinSet,
  isUnlocked,
  lock as lockNow,
  unlock as unlockNow,
} from "./auth";
import useIdleLock from "./useIdleLock";
import useSettings from "./useSettings";

const AuthContext = createContext(null);

/**
 * Whether the till is open. Kept above the routes so nothing — not the
 * notification poller, not the daily backup — runs while it is locked.
 */
export const AuthProvider = ({ children }) => {
  const { settings } = useSettings();
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [pinSet, setPinSet] = useState(isPinSet);

  const unlock = useCallback(() => {
    unlockNow();
    setUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    lockNow();
    setUnlocked(false);
  }, []);

  /** Call after the PIN is created or changed. */
  const refreshPinState = useCallback(() => setPinSet(isPinSet()), []);

  // Lock itself after a quiet spell, if the shopkeeper asked for that.
  useIdleLock({
    enabled: unlocked && pinSet,
    minutes: settings.autoLockMinutes,
    onIdle: lock,
  });

  return (
    <AuthContext.Provider
      value={{
        unlocked,
        pinSet,
        unlock,
        lock,
        refreshPinState,
        autoLockMinutes: Number(settings.autoLockMinutes) || 0,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const INERT = {
  unlocked: true,
  pinSet: false,
  unlock: () => {},
  lock: () => {},
  refreshPinState: () => {},
  autoLockMinutes: 0,
};

/** Falls back to "open" so screens render outside the provider, e.g. in tests. */
export const useAuth = () => useContext(AuthContext) ?? INERT;

export default AuthContext;
