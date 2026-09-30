import {
  BrowserUpdatedOutlined,
  Edit,
  PrintOutlined,
} from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSDialog from "../../shared/IMSDialog";
import IMSRecordCard from "../../shared/IMSRecordCard";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import PageHeader from "../../shared/PageHeader";
import PageToolbar from "../../shared/PageToolbar";
import { MUIStyled } from "../../shared/MUIStyled";
import {
  formatMoney,
  formatStock,
  lineBaseQuantity,
  num,
  productStockInBase,
} from "../../utils/billing";
import { notifyDataChanged } from "../../utils/dataEvents";
import useSettings from "../../utils/useSettings";
import {
  customerKeyOf,
  orderOutstanding,
  ordersForCustomer,
  totalOutstanding,
} from "../../utils/payments";
import CollectPayment from "./collectPayment";
import { Print } from "../dashboard/print";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 260px)",
  "& .MuiTableHead-root": {
    "& .MuiTableCell-root": {
      padding: "8px 10px",
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.white.main,
      zIndex: 9,
      fontWeight: 600,
    },
  },
  "& .MuiTableBody-root": {
    "& .MuiTableCell-root": {
      padding: "8px 10px",
      "& .MuiCollapse-wrapper": {
        backgroundColor: "#f7f9f9",
        "& .MuiTableHead-root": {
          "& .MuiTableCell-root": { backgroundColor: "transparent" },
        },
      },
    },
  },
}));

const SORTABLE = {
  invoiceNo: "string",
  billingDate: "date",
  payment: "string",
  total: "number",
};

const compare = (a, b, property, type) => {
  if (type === "number") return num(a[property]) - num(b[property]);
  if (type === "date")
    return new Date(a[property]).getTime() - new Date(b[property]).getTime();
  return String(a[property] ?? "")
    .toLowerCase()
    .localeCompare(String(b[property] ?? "").toLowerCase());
};

const Orders = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { generateReceipt, downloadReceipt } = Print();

  const [orderList, setOrderList] = useState([]);
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [billDate, setBillDate] = useState(null);
  const [direction, setDirection] = useState("desc");
  const [orderBy, setOrderBy] = useState("billingDate");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [collectFrom, setCollectFrom] = useState(null);
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [importing, setImporting] = useState(false);

  // Arriving from a pending-payment notification pre-fills the search.
  useEffect(() => {
    if (location.state?.search) setSearchText(location.state.search);
  }, [location.state]);

  const load = useCallback(async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response.success) setOrderList(response.data || []);
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleOrders = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const type = SORTABLE[orderBy] || "string";
    return orderList
      .filter((order) =>
        term
          ? order?.customerInfo?.vendorName?.toLowerCase().includes(term) ||
            order?.invoiceNo?.toLowerCase().includes(term) ||
            order?.customerInfo?.vendorPhone?.includes(term)
          : true
      )
      .filter((order) =>
        billDate
          ? dayjs(order?.billingDate).isSame(dayjs(billDate), "day")
          : true
      )
      .filter((order) => (unpaidOnly ? orderOutstanding(order) > 0 : true))
      .slice()
      .sort((a, b) =>
        direction === "asc"
          ? compare(a, b, orderBy, type)
          : compare(b, a, orderBy, type)
      );
  }, [orderList, searchText, billDate, orderBy, direction, unpaidOnly]);

  useEffect(() => setPage(0), [searchText, billDate, unpaidOnly]);

  const handleSort = (property) => {
    const isSame = orderBy === property;
    setDirection(isSame && direction === "asc" ? "desc" : "asc");
    setOrderBy(property);
  };

  /**
   * Deleting a sale returns its items to stock, otherwise the inventory drifts
   * every time a mis-punched bill is removed.
   */
  const handleDeleteOrder = async (order) => {
    try {
      const products = await apiResponse("/product", "GET");
      const productList = products.data || [];

      await apiResponse(`/orders/${order.id}`, "DELETE");

      const restored = new Map();
      (order.order || []).forEach((line) => {
        restored.set(
          line.id,
          (restored.get(line.id) || 0) + lineBaseQuantity(line)
        );
      });

      for (const [productId, quantity] of restored.entries()) {
        const product = productList.find((item) => item.id === productId);
        if (!product || quantity <= 0) continue;
        await apiResponse(`/product/${productId}`, "PATCH", null, {
          stock: formatStock(productStockInBase(product) + quantity),
        });
      }

      setOrderList((prev) => prev.filter((item) => item.id !== order.id));
      setConfirmDelete(null);
      notifyDataChanged();
      toast.success(t("toast.orderDeletedStockRestored"));
    } catch {
      toast.error(t("toast.saveFailed"));
    }
  };

  /** Restore from a backup file: products, customers and orders. */
  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      const collections = [
        ["product", payload.product],
        ["venders", payload.venders],
        ["orders", payload.orders],
      ].filter(([, rows]) => Array.isArray(rows));

      if (collections.length === 0) {
        toast.error(t("toast.importNoCollections"));
        return;
      }

      const summary = [];
      for (const [endpoint, rows] of collections) {
        const existing = await apiResponse(`/${endpoint}`, "GET");
        const existingRows = existing.data || [];
        const seen = new Set(existingRows.map((row) => String(row.id)));
        const seenInvoices = new Set(
          existingRows.map((row) => row.invoiceNo).filter(Boolean)
        );

        const fresh = rows.filter((row) => {
          if (row?.id && seen.has(String(row.id))) return false;
          if (row?.invoiceNo && seenInvoices.has(row.invoiceNo)) return false;
          return true;
        });

        for (const row of fresh) {
          await apiResponse(`/${endpoint}`, "POST", null, {
            ...row,
            id: String(row.id ?? Date.now()),
          });
        }
        summary.push(`${endpoint}: ${fresh.length}`);
      }

      await load();
      notifyDataChanged();
      toast.success(t("toast.imported", { summary: summary.join(", ") }));
    } catch {
      toast.error(t("toast.importFailed"));
    } finally {
      setImporting(false);
    }
  };

  /** How much money is still out there, across every bill. */
  const owed = useMemo(() => totalOutstanding(orderList), [orderList]);
  const unpaidCount = useMemo(
    () => orderList.filter((order) => orderOutstanding(order) > 0).length,
    [orderList]
  );

  const paymentColor = (payment) =>
    payment === "Pending"
      ? "warning"
      : payment === "Online"
      ? "primary"
      : "success";

  const pageRows = visibleOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const sortLabel = (property, label) => (
    <TableSortLabel
      active={orderBy === property}
      direction={orderBy === property ? direction : "asc"}
      onClick={() => handleSort(property)}
    >
      {label}
    </TableSortLabel>
  );

  const rowActions = (data) => (
    <>
      {num(data?.balanceDue) > 0 && (
        <Tooltip title={t("buttonText.collect")}>
          <IconButton
            onClick={() =>
              setCollectFrom({
                key: customerKeyOf(data),
                name: data?.customerInfo?.vendorName || "",
              })
            }
            color="success"
            size="small"
          >
            <CurrencyRupeeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={t("buttonText.update")}>
        <IconButton
          onClick={() => navigate(`/?order/${data.id}`)}
          color="primary"
          size="small"
        >
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("buttonText.delete")}>
        <IconButton
          onClick={() => setConfirmDelete(data)}
          color="error"
          size="small"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("buttonText.print")}>
        <IconButton
          color="primary"
          size="small"
          onClick={() => generateReceipt(data)}
        >
          <PrintOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  const lineItems = (data) => (
    <IMSStack sx={{ mt: 1, pt: 1, borderTop: "1px dashed #e0e5e5" }}>
      {data?.order?.map((item, index) => (
        <IMSStack
          key={`${item.id}-${index}`}
          direction="row"
          justifyContent="space-between"
          sx={{ py: 0.25 }}
        >
          <IMSTypography variant="body2" sx={{ minWidth: 0 }} noWrap>
            {item?.itemName}{" "}
            <IMSTypography component="span" variant="body2" color="natural.main">
              {item?.itemQuantity} {item?.quantityCategory}
            </IMSTypography>
          </IMSTypography>
          <IMSTypography variant="body2" fontWeight={600}>
            {settings.currencySymbol}
            {formatMoney(item?.subtotal)}
          </IMSTypography>
        </IMSStack>
      ))}
      <IMSButton
        size="small"
        variant="outlined"
        sx={{ mt: 1 }}
        onClick={() => downloadReceipt(data)}
      >
        {t("buttonText.download")}
      </IMSButton>
    </IMSStack>
  );

  return (
    <>
      <PageHeader
        title={t("menu.orders")}
        subtitle={t("pageSubtitle.orders")}
        divider={false}
        actions={
          <IMSButton
            component="label"
            variant="outlined"
            disabled={importing}
            sx={{
              "& input": {
                clip: "rect(0 0 0 0)",
                clipPath: "inset(50%)",
                height: 1,
                overflow: "hidden",
                position: "absolute",
                bottom: 0,
                left: 0,
                whiteSpace: "nowrap",
                width: 1,
              },
            }}
          >
            <BrowserUpdatedOutlined sx={{ mr: 1 }} />
            {t("buttonText.import")}
            <input type="file" accept=".json" onChange={handleImport} />
          </IMSButton>
        }
      />
      <PageToolbar
        search={{
          value: searchText,
          onChange: (event) => setSearchText(event.target.value),
          placeholder: t("description.searchOrders"),
        }}
        filters={
          <>
            <IMSDatePicker
              gutterNone
              value={billDate}
              onChange={(value) => setBillDate(value)}
              slotProps={{ field: { clearable: true } }}
              sx={{ minWidth: 190 }}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={unpaidOnly}
              onChange={(event, next) =>
                next !== null && setUnpaidOnly(next)
              }
              sx={{ flexShrink: 0 }}
            >
              <ToggleButton value={false}>{t("menu.all")}</ToggleButton>
              <ToggleButton value={true}>
                {t("description.unpaidFilter", {
                  count: unpaidCount,
                  amount: `${settings.currencySymbol}${formatMoney(owed)}`,
                })}
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        }
      />

      {pageRows.length === 0 ? (
        <IMSTypography textAlign="center" color="natural.main" sx={{ py: 6 }}>
          {t("description.noDataFound")}
        </IMSTypography>
      ) : isMobile ? (
        <IMSStack>
          {pageRows.map((data) => {
            const expanded = open === data.id;
            const balance = num(data?.balanceDue);
            return (
              <IMSRecordCard
                key={data.id}
                title={data?.invoiceNo}
                titleAdornment={
                  <Chip
                    label={data?.payment}
                    size="small"
                    color={paymentColor(data?.payment)}
                  />
                }
                subtitle={`${data?.customerInfo?.vendorName || "—"} · ${dayjs(
                  data?.billingDate
                ).format("DD/MM/YYYY")}`}
                rows={[
                  {
                    label: t("formLabel.totalPrice"),
                    value: `${settings.currencySymbol}${formatMoney(data?.total)}`,
                    strong: true,
                  },
                  ...(balance > 0
                    ? [
                        {
                          label: t("formLabel.balanceDue"),
                          value: `${settings.currencySymbol}${formatMoney(balance)}`,
                          strong: true,
                          color: "error",
                        },
                      ]
                    : []),
                ]}
                actions={rowActions(data)}
                onClick={() => setOpen(expanded ? null : data.id)}
                footer={
                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    {lineItems(data)}
                  </Collapse>
                }
              />
            );
          })}
        </IMSStack>
      ) : (
        <TableContainerStyle>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>
                  {sortLabel("invoiceNo", t("formLabel.invoiceNo"))}
                </TableCell>
                <TableCell>
                  {sortLabel("billingDate", t("formLabel.invoiceDate"))}
                </TableCell>
                <TableCell>{t("formLabel.customerName")}</TableCell>
                <TableCell>{t("formLabel.phoneNumber")}</TableCell>
                <TableCell>
                  {sortLabel("payment", t("formLabel.payment"))}
                </TableCell>
                <TableCell>{t("formLabel.GSTNumber")}</TableCell>
                <TableCell align="right">
                  {sortLabel("total", t("formLabel.totalPrice"))}
                </TableCell>
                <TableCell align="right">{t("formLabel.balanceDue")}</TableCell>
                <TableCell align="right">{t("description.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((data) => {
                const expanded = open === data.id;
                const balance = num(data?.balanceDue);
                return (
                  <React.Fragment key={data.id}>
                    <TableRow
                      hover
                      onClick={() => setOpen(expanded ? null : data.id)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <IconButton aria-label="expand row" size="small">
                          {expanded ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>{data?.invoiceNo}</TableCell>
                      <TableCell>
                        {dayjs(data?.billingDate).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>{data?.customerInfo?.vendorName}</TableCell>
                      <TableCell>{data?.customerInfo?.vendorPhone}</TableCell>
                      <TableCell>
                        <Chip
                          label={data?.payment}
                          size="small"
                          sx={{ width: 80 }}
                          color={paymentColor(data?.payment)}
                        />
                      </TableCell>
                      <TableCell>{data?.GSTNumber || "N/A"}</TableCell>
                      <TableCell align="right">
                        {settings.currencySymbol}
                        {formatMoney(data?.total)}
                      </TableCell>
                      <TableCell align="right">
                        {balance > 0 ? (
                          <IMSTypography
                            component="span"
                            color="error"
                            fontWeight={600}
                          >
                            {settings.currencySymbol}
                            {formatMoney(balance)}
                          </IMSTypography>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell
                        align="right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {rowActions(data)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>
                                  {t("description.item_name")}
                                </TableCell>
                                <TableCell>
                                  {t("description.item_qty")}
                                </TableCell>
                                <TableCell align="right">
                                  {t("description.price")}
                                </TableCell>
                                <TableCell align="right">
                                  {t("description.total")}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data?.order?.map((item, index) => (
                                <TableRow key={`${item.id}-${index}`}>
                                  <TableCell>{item?.itemName}</TableCell>
                                  <TableCell>
                                    {item?.itemQuantity}{" "}
                                    <IMSTypography
                                      color="natural.main"
                                      variant="body2"
                                      component="span"
                                    >
                                      {item?.quantityCategory}
                                    </IMSTypography>
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatMoney(item?.price)}
                                  </TableCell>
                                  <TableCell align="right">
                                    {formatMoney(item?.subtotal)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          <IMSStack
                            direction="row"
                            spacing={3}
                            flexWrap="wrap"
                            justifyContent="flex-end"
                            alignItems="center"
                            sx={{ py: 1, pr: 1, rowGap: 1 }}
                          >
                            <IMSTypography variant="body2">
                              {t("formLabel.subtotal")}:{" "}
                              {settings.currencySymbol}
                              {formatMoney(data?.subtotal)}
                            </IMSTypography>
                            {num(data?.discountAmount) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.discountApplied")}: -
                                {settings.currencySymbol}
                                {formatMoney(data.discountAmount)}
                              </IMSTypography>
                            )}
                            {num(data?.GSTAmount) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.GSTAmount")}:{" "}
                                {settings.currencySymbol}
                                {formatMoney(data.GSTAmount)}
                              </IMSTypography>
                            )}
                            {num(data?.amountPaid) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.amountPay")}:{" "}
                                {settings.currencySymbol}
                                {formatMoney(data.amountPaid)}
                              </IMSTypography>
                            )}
                            <IMSButton
                              size="small"
                              variant="outlined"
                              onClick={() => downloadReceipt(data)}
                            >
                              {t("buttonText.download")}
                            </IMSButton>
                          </IMSStack>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainerStyle>
      )}

      <TablePagination
        labelRowsPerPage={t("description.rowsPerPage")}
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={visibleOrders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, next) => setPage(next)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(+event.target.value);
          setPage(0);
        }}
        sx={{
          "& .MuiTablePagination-toolbar": { flexWrap: "wrap", rowGap: 0.5 },
        }}
      />

      <IMSDialog
        title={t("buttonText.collect")}
        open={Boolean(collectFrom)}
        maxWidth="xs"
        handleClose={() => setCollectFrom(null)}
      >
        <CollectPayment
          customerName={collectFrom?.name}
          orders={ordersForCustomer(orderList, collectFrom?.key)}
          onSaved={() => {
            setCollectFrom(null);
            load();
          }}
        />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={Boolean(confirmDelete)}
        maxWidth="xs"
        handleClose={() => setConfirmDelete(null)}
      >
        <IMSTypography mb={2} color="natural.main">
          {t("description.deleteOrderNote", {
            invoice: confirmDelete?.invoiceNo || "",
          })}
        </IMSTypography>
        <IMSStack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
          <IMSButton
            variant="outlined"
            color="black"
            onClick={() => setConfirmDelete(null)}
          >
            {t("buttonText.cancel")}
          </IMSButton>
          <IMSButton
            variant="contained"
            color="error"
            onClick={() => handleDeleteOrder(confirmDelete)}
          >
            {t("buttonText.delete")}
          </IMSButton>
        </IMSStack>
      </IMSDialog>
    </>
  );
};

export default Orders;
