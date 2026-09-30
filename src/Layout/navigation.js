import {
  Dashboard,
  Inventory,
  Orders,
  Reports,
  Settings,
  Suppliers,
} from "../shared/icon";

/**
 * One definition of the navigation, shared by the sidebar, the mobile bottom
 * bar and the header title.
 *
 * `primary` items get a slot in the mobile bottom bar; the rest live behind
 * "More", which opens the drawer. `badge` names a live alert count.
 */
export const navItems = [
  {
    key: "dashboard",
    labelKey: "menu.dashboard",
    link: "/",
    Icon: Dashboard,
    group: "sell",
    primary: true,
  },
  {
    key: "orders",
    labelKey: "menu.orders",
    link: "/orders",
    Icon: Orders,
    group: "sell",
    badge: "orders",
    primary: true,
  },
  {
    key: "product",
    labelKey: "menu.product",
    link: "/product",
    Icon: Inventory,
    group: "stock",
    badge: "product",
    primary: true,
  },
  {
    key: "customer",
    labelKey: "menu.customer",
    link: "/customer",
    Icon: Suppliers,
    group: "stock",
    primary: false,
  },
  {
    key: "reports",
    labelKey: "menu.reports",
    link: "/reports",
    Icon: Reports,
    group: "manage",
    primary: true,
  },
  {
    key: "settings",
    labelKey: "menu.settings",
    link: "/settings",
    Icon: Settings,
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

