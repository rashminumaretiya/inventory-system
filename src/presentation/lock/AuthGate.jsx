import React from "react";

import { useAuth } from "../../utils/AuthContext";
import Lock from "./index";

/**
 * Stands between the app and everything behind it. On first run it asks the
 * shopkeeper to choose a PIN; after that it asks for it.
 */
const AuthGate = ({ children }) => {
  const { unlocked, pinSet, unlock, refreshPinState } = useAuth();

  if (!pinSet) {
    return (
      <Lock
        mode="setup"
        onPinSet={() => {
          refreshPinState();
          unlock();
        }}
      />
    );
  }

  if (!unlocked) return <Lock mode="unlock" onUnlocked={unlock} />;

  return children;
};

export default AuthGate;
