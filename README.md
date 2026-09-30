# Inventory & Billing System

A single-till billing and stock system for a small store: ring up a bill, print
a thermal receipt, track stock, keep customers, and see daily/monthly sales.
React + MUI on the front, a JSON API behind it, English and Gujarati throughout.

## Running it

```bash
npm install
npm start           # http://localhost:3000
```

By default the app talks to the hosted JSON API. To work against the bundled
local server instead, create `.env.local`:

```
REACT_APP_API_BASE_URL=http://localhost:8000
```

and run the API alongside the app:

```bash
npm run server      # json-server on :8000, backed by database.json
```

Other scripts:

```bash
npm test            # unit + integration tests
npm run build       # production bundle in build/
```

## How the data is shaped

Three collections: `product`, `venders` (customers) and `orders`.

**Units.** A product is stocked and priced in exactly one base unit:

| Product unit | Stock held in | Price is |
| ------------ | ------------- | -------- |
| `Kg`         | kilograms     | per Kg   |
| `Pcs.`       | pieces        | per piece |

While billing, a weight item may be entered in grams for convenience; the value
is converted to Kg before it touches stock or money. Products saved earlier with
`quantityCategory: "Grams"` already held their stock in Kg, so they are read as
Kg and rewritten as Kg the next time they are edited.

All of this lives in [`src/utils/billing.js`](src/utils/billing.js) — line
subtotals, bill totals, GST, discount, change, stock deltas and invoice
numbering. Prefer it over doing arithmetic inline; it is covered by tests.

**Bill totals** are calculated as:

```
subtotal   = sum of line subtotals
taxable    = subtotal - discount        (discount is clamped to the subtotal)
GST        = taxable x GST rate         (rounded to paise)
total      = taxable + GST
```

## Shop settings

Shop name, address, phone, GSTIN, invoice prefix, GST rate, low-stock threshold,
receipt footer, which notifications appear and the daily backup hour are all
editable under **Settings** and stored in `localStorage`. They drive the printed
receipt, the GST applied to every bill and the low-stock warnings, so none of it
is hard-coded.

## Credit (khata) and stock movement

Two things a shop does every day that the bill screen alone cannot express:

**Collecting later.** A bill records what was taken at the till, but credit
customers pay days afterwards. [`src/utils/payments.js`](src/utils/payments.js)
spreads a lump sum across a customer's unpaid bills **oldest first**, which is
how a khata is normally settled — the shopkeeper just enters what was handed
over. The dialog previews exactly which bills it clears before saving, never
accepts more than is owed, appends to a `payments` history on each bill, and
flips a fully paid bill out of `Pending`. Without this a `balanceDue` could only
ever be set at billing time, so a pending-payment alert could never be cleared.

Orders can be filtered to **unpaid only**, with the total still to collect shown
on the filter itself.

**Receiving goods.** Stock previously only ever went *down*. **Products → Add
Stock** takes the quantity that arrived (in Kg, Grams or Pcs.) and *adds* it to
the shelf rather than replacing the figure, so nobody does the sum by hand. It
previews the resulting stock and lets the buying price be corrected at the same
time, since that is when it changes.

## Notifications

The bell warns about the two things that cost a small shop money: unpaid bills
and stock about to run out.

[`src/utils/notifications.js`](src/utils/notifications.js) builds the list:

- **Pending payments** — grouped per customer, not per bill, so someone who owes
  on four bills is one alert showing the total, the bill count and the age of the
  oldest. Bills saved before `balanceDue` existed count as fully unpaid when
  marked Pending.
- **Low / out of stock** — using a product's own `lowStockAt` when set, otherwise
  the shop threshold.

Each alert carries translation keys rather than finished text, so the panel reads
correctly in both languages, and links to the screen that resolves it with the
search box pre-filled. Alerts carry a `signature` of the numbers behind them:
dismissing "low stock" hides that alert, but it returns if stock drops further.
Read and dismissed state lives in `localStorage`.

One `NotificationsProvider` feeds both the bell and the sidebar badges, so only
one poller runs. It refreshes on a timer, when the window regains focus, and
whenever a sale, edit, delete or import fires `notifyDataChanged()`.

## Responsive layout

The same screens serve a desktop till and a phone:

- **Desktop** — a permanent light sidebar carries the shop identity, grouped
  navigation with live alert badges, and the bell. There is no top bar; each page
  opens with its own title and description.
- **Phone** — a top bar with menu and bell, the sidebar as a drawer, and a bottom
  tab bar for Billing, Orders, Products and Reports. Wide tables become record
  cards, dialogs go full screen, and the billing screen keeps Save within thumb
  reach in a sticky bar above the tabs.

Breakpoint-sensitive pieces live in the shared components — `PageHeader`,
`PageToolbar`, `IMSRecordCard`, `SettingsSection` and `IMSTabs` — so a new screen
gets the same behaviour without repeating the media queries.

## Daily backup

[`src/utils/backup.js`](src/utils/backup.js) downloads a full JSON export of all
three collections once a day:

- on first load if that day's backup has not been taken yet, then at the hour
  set in Settings;
- guarded by `lastBackupDate` in `localStorage`, so it runs once per day even if
  the app stays open or is reopened many times;
- guarded by a short-lived lock, so two open tabs do not both download;
- the file is `YYYY-MM-DD_backup.json` and carries `backupVersion`, `exportedAt`
  and row counts, so a restore can check what it is looking at.

**Restore** from the Orders screen's *Import* button. It accepts a backup file
and adds any products, customers and orders it does not already have, matching on
id and invoice number, so importing the same file twice is safe.

Because a browser will not always download a file without a click, take a manual
backup from **Settings → Backup Now** (or **Reports → Download**) if the
automatic one is ever blocked.

## Layout

```
src/
  api/            axios wrapper; base URL from REACT_APP_API_BASE_URL
  container/      screen logic (hooks) — no JSX
  description/    form field definitions, incl. validation pattern + sector
  presentation/   screens and dialogs
  Layout/         app shell: sidebar, header, bottom nav, notification bell
  shared/         IMS* wrappers around MUI, plus layout primitives
  store/slice/    redux slices
  utils/          billing, payments, reporting, notifications, backup,
                  settings, validation
  i18n/locals/    en.json and gu.json (kept at matching keys)
```

A form field's `sector` says where its value belongs — `customerInfo`, `order`
(the line being entered) or `bill` (the bill as a whole). The billing container
routes edits by that field, so adding a field means declaring its sector rather
than special-casing its name. Fields also carry `xs`/`md` grid widths, which is
how the billing form stacks on a phone without any per-screen media queries.

## Tests

```bash
npm test
```

176 tests across 10 suites:

- `src/utils/*.test.js` — billing maths, payment allocation, validation,
  reporting, notification rules and the backup schedule. The billing tests
  assert against the real rows in `database.json`, so a change that would
  reprice historical orders fails.
- `src/presentation/dashboard/__tests__/billingFlow.test.jsx` — drives the real
  billing screen: add and merge lines, unit handling, stock limits, GST,
  discount, change, validation and save.
- `src/Layout/__tests__/notificationBell.test.jsx` — badge count, panel contents,
  dismissing, navigation and the settings switches.
- `src/__tests__/shopkeeperFlows.test.jsx` — receiving stock and collecting
  payment, including unit conversion and oldest-first allocation.
- `src/__tests__/screens.test.jsx` — product, customer, orders, reports and the
  tabbed settings screen.
