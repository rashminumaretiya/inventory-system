import AnalyticsIcon from "@mui/icons-material/Analytics";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

/**
 * One definition of the navigation, shared by the sidebar, the mobile bottom
 * bar and the header title.
 *
 * `primary` items get a slot in the mobile bottom bar; the rest live behind
 * "More", which opens the drawer. `badge` names a live alert count.
 *
 * Each item has an outlined `Icon` and a filled `ActiveIcon` (filled marks
 * where you are), and a `tint` of its own, so a shopkeeper finds a screen by
 * colour as much as by reading.
 */
export const navItems = [
  {
    key: "dashboard",
    labelKey: "menu.dashboard",
    link: "/",
    Icon: PointOfSaleOutlinedIcon,
    ActiveIcon: PointOfSaleIcon,
    tint: "#007881",
    group: "sell",
    primary: true,
  },
  {
    key: "orders",
    labelKey: "menu.orders",
    link: "/orders",
    Icon: ReceiptLongOutlinedIcon,
    ActiveIcon: ReceiptLongIcon,
    tint: "#2563EB",
    group: "sell",
    badge: "orders",
    primary: true,
  },
  {
    key: "product",
    labelKey: "menu.product",
    link: "/product",
    Icon: Inventory2OutlinedIcon,
    ActiveIcon: Inventory2Icon,
    tint: "#B45309",
    group: "stock",
    badge: "product",
    primary: true,
  },
  {
    key: "customer",
    labelKey: "menu.customer",
    link: "/customer",
    Icon: PeopleAltOutlinedIcon,
    ActiveIcon: PeopleAltIcon,
    tint: "#DB2777",
    group: "stock",
    primary: false,
  },
  {
    key: "reports",
    labelKey: "menu.reports",
    link: "/reports",
    Icon: AnalyticsOutlinedIcon,
    ActiveIcon: AnalyticsIcon,
    tint: "#7C3AED",
    group: "manage",
    primary: true,
  },
  {
    key: "settings",
    labelKey: "menu.settings",
    link: "/settings",
    Icon: SettingsOutlinedIcon,
    ActiveIcon: SettingsIcon,
    tint: "#475569",
    group: "manage",
    primary: false,
  },
];

/** Sidebar sections, in order, with their small-caps heading. */
export const navGroups = [
  { key: "sell", titleKey: "menu.groupSell" },
  { key: "stock", titleKey: "menu.groupStock" },
  { key: "manage", titleKey: "menu.groupManage" },
];

export const itemsInGroup = (group) =>
  navItems.filter((item) => item.group === group);

export const primaryNavItems = navItems.filter((item) => item.primary);

/** The item whose link matches `pathname`, used for the header title. */
export const activeNavItem = (pathname) =>
  navItems.find((item) => item.link === pathname);

/** The item for a screen by key, e.g. to borrow its icon and colour. */
export const navItemByKey = (key) => navItems.find((item) => item.key === key);
