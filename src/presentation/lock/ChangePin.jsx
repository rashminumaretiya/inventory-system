import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../utils/AuthContext";
import Lock from "./index";

/**
 * Two steps: prove you know the current PIN, then set the new one twice.
 * Both steps reuse the lock screen itself, so the keypad behaves identically.
 */
const ChangePin = ({ onDone }) => {
  const { t } = useTranslation();
  const { refreshPinState } = useAuth();
  const [verified, setVerified] = useState(false);

  if (!verified) {
    return (
      <Lock
        fullScreen={false}
        mode="unlock"
        onUnlocked={() => setVerified(true)}
      />
    );
  }

  return (
    <Lock
      fullScreen={false}
      mode="setup"
      onPinSet={() => {
        refreshPinState();
        toast.success(t("toast.pinChanged"));
        onDone?.();
      }}
    />
  );
};

export default ChangePin;
