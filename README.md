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
receipt footer and the daily backup hour are all editable under **Settings** and
stored in `localStorage`. They drive the printed receipt, the GST applied to
every bill and the low-stock warnings, so none of it is hard-coded.

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
  shared/         IMS* wrappers around MUI
  store/slice/    redux slices
  utils/          billing, reporting, backup, settings, validation
  i18n/locals/    en.json and gu.json (kept at matching keys)
```

A form field's `sector` says where its value belongs — `customerInfo`, `order`
(the line being entered) or `bill` (the bill as a whole). The billing container
routes edits by that field, so adding a field means declaring its sector rather
than special-casing its name.

## Tests

```bash
npm test
```

- `src/utils/*.test.js` — billing maths, validation, reporting, backup schedule.
  The billing tests assert against the real rows in `database.json`, so a change
  that would reprice historical orders fails.
- `src/presentation/dashboard/__tests__/billingFlow.test.jsx` — drives the real
  billing screen: add and merge lines, unit handling, stock limits, GST,
  discount, change, validation and save.
- `src/__tests__/screens.test.jsx` — product, customer, orders, reports and
  settings screens.
