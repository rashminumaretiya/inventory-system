import { useCallback, useEffect, useState } from "react";
import { getSettings, saveSettings } from "./settings";

/**
 * Shop settings with live updates, so saving on the Settings page immediately
 * changes the GST rate and low-stock threshold everywhere else.
 */
const useSettings = () => {
  const [settings, setSettings] = useState(getSettings);

  useEffect(() => {
    const sync = () => setSettings(getSettings());
    window.addEventListener("shopSettingsChanged", sync);
    // Another tab of the same till.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("shopSettingsChanged", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch) => setSettings(saveSettings(patch)), []);

  return { settings, updateSettings: update };
};

export default useSettings;
