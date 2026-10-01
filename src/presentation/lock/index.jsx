import { CircularProgress, keyframes } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { ReactComponent as Logo } from "../../assets/logo.svg";
import IMSBox from "../../shared/IMSBox";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import {
  PIN_LENGTH,
  lockoutRemaining,
  registerFailure,
  setPin,
  verifyPin,
} from "../../utils/auth";
import useSettings from "../../utils/useSettings";

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
`;

const pulse = keyframes`
  0%   { transform: scale(1);   opacity: .55; }
  70%  { transform: scale(1.45); opacity: 0; }
  100% { transform: scale(1.45); opacity: 0; }
`;

/**
 * The till's PIN screen: the shop's own mark, and nothing to fill in but the
 * PIN. There is no on-screen keypad — the hidden field carries `inputMode
 * numeric`, so a phone raises its own number pad and a counter keyboard just
 * types.
 *
 * Doubles as first-run setup, where it asks for the PIN twice.
 */
const Lock = ({ mode = "unlock", onUnlocked, onPinSet, fullScreen = true }) => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const isSetup = mode === "setup";

  const [entry, setEntry] = useState("");
  const [firstEntry, setFirstEntry] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitSeconds, setWaitSeconds] = useState(() =>
    Math.ceil(lockoutRemaining() / 1000)
  );
  const errorKey = useRef(0);
  const inputRef = useRef(null);

  /** Tick down the cooldown after too many wrong tries. */
  useEffect(() => {
    if (waitSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      const left = Math.ceil(lockoutRemaining() / 1000);
      setWaitSeconds(left);
      if (left <= 0) setError("");
    }, 1000);
    return () => clearInterval(timer);
  }, [waitSeconds]);

  const held = waitSeconds > 0;

  const fail = useCallback((message) => {
    errorKey.current += 1;
    setError(message);
    setEntry("");
  }, []);

  const submit = useCallback(
    async (pin) => {
      setBusy(true);
      try {
        if (isSetup) {
          if (!firstEntry) {
            setFirstEntry(pin);
            setEntry("");
            setError("");
            return;
          }
          if (pin !== firstEntry) {
            setFirstEntry("");
            fail(t("lock.pinMismatch"));
            return;
          }
          await setPin(pin);
          onPinSet?.();
          return;
        }

        if (await verifyPin(pin)) {
          onUnlocked?.();
          return;
        }

        const { lockedUntil, attemptsLeft } = registerFailure();
        if (lockedUntil) {
          setWaitSeconds(Math.ceil((lockedUntil - Date.now()) / 1000));
          fail(t("lock.tooManyTries"));
        } else {
          fail(t("lock.wrongPin", { count: attemptsLeft }));
        }
      } finally {
        setBusy(false);
      }
    },
    [fail, firstEntry, isSetup, onPinSet, onUnlocked, t]
  );

  const handleChange = (event) => {
    if (held || busy) return;
    const digits = event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
    setEntry(digits);
    setError("");
    if (digits.length === PIN_LENGTH) submit(digits);
  };

  /** Keep the caret here: there is nothing else on this screen to type into. */
  const focusInput = useCallback(() => inputRef.current?.focus(), []);
  useEffect(() => {
    focusInput();
  }, [focusInput, firstEntry, error]);

  const title = isSetup
    ? firstEntry
      ? t("lock.confirmPin")
      : t("lock.createPin")
    : t("lock.enterPin");

  const card = (
    <IMSBox
      onClick={focusInput}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        px: { xs: 3, sm: 5 },
        py: { xs: 4, sm: 5 },
        borderRadius: 4,
        textAlign: "center",
        cursor: "text",
        ...(fullScreen && {
          bgcolor: "white.main",
          boxShadow: "0 24px 60px rgba(0,0,0,.22)",
        }),
      }}
    >
      {fullScreen && (
        <>
          {/* The shop's own mark, so the till is recognisable before unlocking. */}
          <IMSBox
            sx={{
              position: "relative",
              width: 76,
              height: 76,
              mx: "auto",
              mb: 3,
              borderRadius: "50%",
              bgcolor: "primary.main",
              display: "grid",
              placeItems: "center",
              "& svg": { width: 46, height: 46 },
              // A slow halo, so the screen feels alive while it waits.
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid",
                borderColor: "primary.main",
                animation: `${pulse} 2.6s ease-out infinite`,
              },
            }}
          >
            <Logo />
          </IMSBox>

          <IMSTypography variant="h6" sx={{ lineHeight: 1.2 }}>
            {settings.shopName}
          </IMSTypography>
          <IMSBox
            sx={{
              width: 34,
              height: 3,
              bgcolor: "primary.main",
              borderRadius: 2,
              mx: "auto",
              my: 2,
            }}
          />
        </>
      )}

      <IMSTypography
        variant="body2"
        sx={{ color: "text.secondary", letterSpacing: ".08em", textTransform: "uppercase" }}
      >
        {title}
      </IMSTypography>

      {/* The field is invisible; the dots are the visible state of it. */}
      <IMSBox sx={{ position: "relative", mt: 2.5, mb: 1 }}>
        <IMSStack
          key={errorKey.current}
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ animation: error ? `${shake} .35s` : "none" }}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = index < entry.length;
            return (
              <IMSBox
                key={index}
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: 2,
                  borderColor: error ? "error.main" : "primary.main",
                  bgcolor: filled
                    ? error
                      ? "error.main"
                      : "primary.main"
                    : "transparent",
                  transform: filled ? "scale(1.12)" : "scale(1)",
                  transition: "all .14s ease",
                }}
              />
            );
          })}
        </IMSStack>

        <input
          ref={inputRef}
          value={entry}
          onChange={handleChange}
          onBlur={() => {
            // Nothing else here wants focus, so take it straight back.
            if (!held) setTimeout(focusInput, 0);
          }}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          aria-label={title}
          disabled={held}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            border: 0,
            padding: 0,
            background: "transparent",
            caretColor: "transparent",
            cursor: "text",
          }}
        />
      </IMSBox>

      {/* Fixed height so the card does not jump when a message appears. */}
      <IMSBox sx={{ minHeight: 26, display: "grid", placeItems: "center" }}>
        {busy ? (
          <CircularProgress size={16} />
        ) : (
          <IMSTypography variant="body2" color="error.main">
            {held ? t("lock.tryAgainIn", { seconds: waitSeconds }) : error}
          </IMSTypography>
        )}
      </IMSBox>
    </IMSBox>
  );

  if (!fullScreen) return card;

  return (
    <IMSStack
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: "100vh",
        "@supports (min-height: 100dvh)": { minHeight: "100dvh" },
        px: 3,
        py: 4,
        position: "relative",
        overflow: "hidden",
        background: (theme) =>
          `linear-gradient(160deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        // Soft light behind the card.
        "&::before": {
          content: '""',
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,.16), transparent 70%)",
          top: "-18%",
          right: "-14%",
        },
      }}
    >
      {card}
    </IMSStack>
  );
};

export default Lock;
