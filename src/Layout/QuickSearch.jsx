import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import BackupOutlinedIcon from "@mui/icons-material/BackupOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TranslateOutlinedIcon from "@mui/icons-material/TranslateOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Chip,
  Dialog,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListSubheader,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { apiResponse } from "../api";
import i18n from "../i18n/i18n";
import IMSBox from "../shared/IMSBox";
import IMSStack from "../shared/IMSStack";
import IMSTextField from "../shared/IMSTextField";
import IMSTypography from "../shared/IMSTypography";
import Kbd, { searchShortcutLabel } from "../shared/Kbd";
import { surface } from "../shared/theme";
import { useAuth } from "../utils/AuthContext";
import { runBackup } from "../utils/backup";
import {
  baseUnitOf,
  formatMoney,
  formatQuantity,
  productStockInBase,
  stockStatus,
} from "../utils/billing";
import { useNotificationsContext } from "../utils/NotificationsContext";
import {
  customerKeyOfRecord,
  duesByCustomer,
  orderOutstanding,
} from "../utils/payments";
import { matchActions, searchEverything } from "../utils/quickSearch";
import useSettings from "../utils/useSettings";
import NavIcon from "./NavIcon";
import { navItemByKey } from "./navigation";

/** An icon tile for things that are not menu screens. */
const tile = (Icon, tint) => ({ Icon, ActiveIcon: Icon, tint });

/** Customers are not polled anywhere else; keep the last list between opens. */
let customerCache = [];

/** The shortcuts the till understands, listed under the results. */
const SHORTCUTS = [
  { keys: () => searchShortcutLabel(), labelKey: "shortcut.search" },
  { keys: () => "F2", labelKey: "shortcut.item" },
  { keys: () => "F4", labelKey: "shortcut.customer" },
  { keys: () => "F9", labelKey: "shortcut.save" },
];

const baseLanguage = (tag) => (String(tag || "").startsWith("gu") ? "gu" : "en");

/**
 * Quick Search: one box for every item, customer and bill, plus the things a
 * shopkeeper does all day ("collect payments", "low stock", "backup now").
 * Arrow keys move, Enter opens, Esc closes; on a phone it takes the screen.
 */
const QuickSearch = ({ open, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { lock } = useAuth();
  const { settings } = useSettings();
  const { orders, products } = useNotificationsContext();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [customers, setCustomers] = useState(customerCache);
  const optionRefs = useRef([]);

  // Fresh on every open; the cached list shows meanwhile.
  useEffect(() => {
    if (!open) return undefined;
    setQuery("");
    setActive(0);
    let live = true;
    apiResponse("/venders", "GET")
      .then((response) => {
        if (!live || !Array.isArray(response?.data)) return;
        customerCache = response.data;
        setCustomers(response.data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [open]);

  const money = (value) => `${settings.currencySymbol}${formatMoney(value)}`;
  const dues = useMemo(() => duesByCustomer(orders), [orders]);

  const otherLanguage =
    baseLanguage(i18n.language) === "gu"
      ? { code: "en", name: "English" }
      : { code: "gu", name: "ગુજરાતી" };

  const actions = [
    {
      id: "newBill",
      labelKey: "action.newBill",
      icon: navItemByKey("dashboard"),
      run: () => navigate("/"),
    },
    {
      id: "collect",
      labelKey: "action.collect",
      icon: tile(CurrencyRupeeIcon, "#067647"),
      run: () => navigate("/orders", { state: { unpaidOnly: true } }),
    },
    {
      id: "lowStock",
      labelKey: "action.lowStock",
      icon: tile(WarningAmberOutlinedIcon, "#B54708"),
      run: () => navigate("/product", { state: { statusFilter: "low" } }),
    },
    {
      id: "addProduct",
      labelKey: "action.addProduct",
      icon: tile(AddBusinessOutlinedIcon, "#B45309"),
      run: () => navigate("/product", { state: { add: true } }),
    },
    {
      id: "addCustomer",
      labelKey: "action.addCustomer",
      icon: tile(PersonAddAltOutlinedIcon, "#DB2777"),
      run: () => navigate("/customer", { state: { add: true } }),
    },
    {
      id: "reports",
      labelKey: "action.reports",
      icon: navItemByKey("reports"),
      run: () => navigate("/reports"),
    },
    {
      id: "settings",
      labelKey: "action.settings",
      icon: navItemByKey("settings"),
      run: () => navigate("/settings"),
    },
    {
      id: "backup",
      labelKey: "action.backupNow",
      icon: tile(BackupOutlinedIcon, "#0E7490"),
      run: async () => {
        try {
          await runBackup({ force: true });
          toast.success(t("toast.backupDownloaded"));
        } catch (error) {
          toast.error(t("toast.backupFailed", { message: error.message }));
        }
      },
    },
    {
      id: "language",
      labelKey: "action.language",
      labelParams: { language: otherLanguage.name },
      icon: tile(TranslateOutlinedIcon, "#4F46E5"),
      run: () => i18n.changeLanguage(otherLanguage.code),
    },
    {
      id: "lock",
      labelKey: "action.lock",
      icon: tile(LockOutlinedIcon, "#475569"),
      run: lock,
    },
  ];

  const entries = (() => {
    const found = searchEverything({ query, products, customers, orders });
    // English too, so "bill" finds "New bill" while the app is in Gujarati.
    const labelsOf = (action) => [
      t(action.labelKey, action.labelParams),
      i18n.t(action.labelKey, { ...action.labelParams, lng: "en" }),
    ];

    const list = matchActions(actions, query, labelsOf).map((action) => ({
      kind: "actions",
      key: `action:${action.id}`,
      icon: action.icon,
      title: t(action.labelKey, action.labelParams),
      run: action.run,
    }));

    found.products.forEach((product) => {
      const unit = baseUnitOf(product.quantityCategory);
      const status = stockStatus(product, settings.lowStockThreshold);
      list.push({
        kind: "items",
        key: `product:${product.id}`,
        icon: navItemByKey("product"),
        title: product.itemName,
        subtitle: t("search.inStock", {
          stock: formatQuantity(productStockInBase(product)),
          unit,
          price: `${money(product.price)}/${unit}`,
        }),
        badge:
          status === "ok" ? null : (
            <Chip
              size="small"
              color={status === "out" ? "error" : "warning"}
              label={t(
                status === "out" ? "description.outOfStock" : "description.lowStock",
              )}
            />
          ),
        run: () => navigate("/product", { state: { search: product.itemName } }),
      });
    });

    found.customers.forEach((customer) => {
      const due = dues.get(customerKeyOfRecord(customer));
      list.push({
        kind: "customers",
        key: `customer:${customer.id}`,
        icon: navItemByKey("customer"),
        title: customer.name,
        subtitle: customer.phone || customer.address || "",
        badge: due ? (
          <Chip
            size="small"
            color="error"
            variant="outlined"
            label={t("search.due", { amount: money(due.amount) })}
          />
        ) : null,
        run: () => navigate("/customer", { state: { search: customer.name } }),
      });
    });

    found.bills.forEach((order) => {
      const owed = orderOutstanding(order);
      list.push({
        kind: "bills",
        key: `bill:${order.id}`,
        icon: navItemByKey("orders"),
        title: order.invoiceNo,
        subtitle: t("search.billMeta", {
          name: order.customerInfo?.vendorName || "—",
          date: dayjs(order.billingDate).format("DD/MM/YYYY"),
          total: money(order.total),
        }),
        badge:
          owed > 0 ? (
            <Chip
              size="small"
              color="error"
              variant="outlined"
              label={t("search.due", { amount: money(owed) })}
            />
          ) : null,
        run: () => navigate("/orders", { state: { search: order.invoiceNo } }),
      });
    });

    return list;
  })();

  // Keep the highlight on a real row as the list shrinks and grows.
  useEffect(() => {
    setActive((current) => Math.min(current, Math.max(entries.length - 1, 0)));
  }, [entries.length]);

  useEffect(() => {
    optionRefs.current[active]?.scrollIntoView?.({ block: "nearest" });
  }, [active]);

  const choose = (entry) => {
    if (!entry) return;
    onClose();
    entry.run();
  };

  const handleKeyDown = (event) => {
    if (!entries.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % entries.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + entries.length) % entries.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(entries[active]);
    }
  };

  const listId = "quick-search-results";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={fullScreen}
      aria-label={t("search.open")}
      sx={{ "& .MuiDialog-container": { alignItems: { sm: "flex-start" } } }}
      PaperProps={{
        sx: {
          mt: { sm: "10vh" },
          borderRadius: { sm: 3 },
          maxHeight: { sm: "76vh" },
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <IMSStack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{
          p: 1.5,
          pt: "calc(12px + env(safe-area-inset-top))",
          borderBottom: `1px solid ${surface.border}`,
          flexShrink: 0,
        }}
      >
        <IMSBox sx={{ flex: 1, minWidth: 0 }}>
          <IMSTextField
            gutterNone
            autoFocus
            transliterate
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ color: "natural.main" }} />
                </InputAdornment>
              ),
            }}
            inputProps={{
              role: "combobox",
              "aria-label": t("search.placeholder"),
              "aria-expanded": entries.length > 0,
              "aria-controls": listId,
              "aria-autocomplete": "list",
              "aria-activedescendant": entries.length
                ? `quick-search-option-${active}`
                : undefined,
              autoComplete: "off",
              enterKeyHint: "go",
            }}
            sx={{ "& .MuiInputBase-input": { fontSize: 16, py: 1.25 } }}
          />
        </IMSBox>
        <IconButton onClick={onClose} aria-label={t("buttonText.cancel")}>
          <CloseIcon />
        </IconButton>
      </IMSStack>

      <IMSBox sx={{ overflowY: "auto", flex: 1, py: 1 }}>
        {entries.length === 0 ? (
          <IMSTypography
            textAlign="center"
            color="natural.main"
            sx={{ py: 6, px: 3 }}
          >
            {t("search.noResults", { query: query.trim() })}
          </IMSTypography>
        ) : (
          <List id={listId} role="listbox" disablePadding>
            {entries.map((entry, index) => {
              const heading =
                index === 0 || entries[index - 1].kind !== entry.kind;
              const selected = index === active;
              return (
                <IMSBox key={entry.key} role="presentation">
                  {heading && (
                    <ListSubheader
                      disableSticky
                      role="presentation"
                      sx={{
                        lineHeight: "30px",
                        px: 2.5,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "natural.main",
                        bgcolor: "transparent",
                      }}
                    >
                      {t(`search.${entry.kind}`)}
                    </ListSubheader>
                  )}
                  <ListItemButton
                    id={`quick-search-option-${index}`}
                    role="option"
                    aria-selected={selected}
                    selected={selected}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    onClick={() => choose(entry)}
                    onMouseMove={() => !selected && setActive(index)}
                    sx={{
                      mx: 1,
                      px: 1.5,
                      py: 0.875,
                      gap: 1.5,
                      borderRadius: 2,
                      "&.Mui-selected, &.Mui-selected:hover": {
                        bgcolor: "primary.light",
                      },
                    }}
                  >
                    <NavIcon item={entry.icon} size={30} />
                    <IMSStack sx={{ minWidth: 0, flex: 1 }}>
                      <IMSTypography variant="body2" fontWeight={600} noWrap>
                        {entry.title}
                      </IMSTypography>
                      {entry.subtitle && (
                        <IMSTypography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {entry.subtitle}
                        </IMSTypography>
                      )}
                    </IMSStack>
                    {entry.badge}
                    {selected && !fullScreen && (
                      <KeyboardReturnIcon
                        aria-hidden
                        sx={{ fontSize: 16, color: "natural.main" }}
                      />
                    )}
                  </ListItemButton>
                </IMSBox>
              );
            })}
          </List>
        )}
      </IMSBox>

      {/* Keyboards only: a touch screen has no use for key hints. */}
      <IMSStack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        columnGap={2}
        rowGap={0.75}
        sx={{
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${surface.border}`,
          bgcolor: surface.subtle,
          flexShrink: 0,
          "@media (hover: none)": { display: "none" },
        }}
      >
        <IMSTypography variant="caption" color="text.secondary" fontWeight={600}>
          {t("search.keysHint")}
        </IMSTypography>
        {SHORTCUTS.map((shortcut) => (
          <IMSStack
            key={shortcut.labelKey}
            direction="row"
            alignItems="center"
            spacing={0.75}
          >
            <Kbd>{shortcut.keys()}</Kbd>
            <IMSTypography variant="caption" color="text.secondary">
              {t(shortcut.labelKey)}
            </IMSTypography>
          </IMSStack>
        ))}
      </IMSStack>
    </Dialog>
  );
};

export default QuickSearch;
