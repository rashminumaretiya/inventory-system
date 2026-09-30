import {
  BrowserUpdatedOutlined,
  Edit,
  PrintOutlined,
} from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Chip,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSDialog from "../../shared/IMSDialog";
import IMSGrid from "../../shared/IMSGrid";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import { Search } from "../../shared/icon";
import {
  formatMoney,
  formatStock,
  lineBaseQuantity,
  num,
  productStockInBase,
} from "../../utils/billing";
import useSettings from "../../utils/useSettings";
import { Print } from "../dashboard/print";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 220px)",
  "& .MuiTableHead-root": {
    "& .MuiTableCell-root": {
      padding: 5,
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.white.main,
      zIndex: 9,
    },
  },
  "& .MuiTableBody-root": {
    "& .MuiTableCell-root": {
      padding: 5,
      "& .MuiCollapse-wrapper": {
        backgroundColor: "#f7f7f7",
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
  const navigate = useNavigate();
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
  const [importing, setImporting] = useState(false);

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
      .slice()
      .sort((a, b) =>
        direction === "asc"
          ? compare(a, b, orderBy, type)
          : compare(b, a, orderBy, type)
      );
  }, [orderList, searchText, billDate, orderBy, direction]);

  useEffect(() => setPage(0), [searchText, billDate]);

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
      toast.success(t("toast.imported", { summary: summary.join(", ") }));
    } catch {
      toast.error(t("toast.importFailed"));
    } finally {
      setImporting(false);
    }
  };

  const paymentColor = (payment) =>
    payment === "Pending" ? "warning" : payment === "Online" ? "primary" : "success";

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

  return (
    <>
      <IMSGrid container justifyContent="space-between" spacing={3}>
        <IMSGrid item md={4}>
          <IMSTextField
            variant="outlined"
            placeholder={t("description.searchOrders")}
            gutterNone
            name="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </IMSGrid>
        <IMSGrid item md={5}>
          <IMSStack direction="row" alignItems="flex-start" gap={2}>
            <IMSDatePicker
              value={billDate}
              onChange={(value) => setBillDate(value)}
              slotProps={{ field: { clearable: true } }}
              sx={{ "& .MuiButtonBase-root": { position: "absolute" } }}
            />
            <IMSButton
              component="label"
              variant="contained"
              disabled={importing}
              sx={{
                flex: "none",
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
          </IMSStack>
        </IMSGrid>
      </IMSGrid>
      <Divider sx={{ mb: 3 }} />
      <TableContainerStyle>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>{sortLabel("invoiceNo", t("formLabel.invoiceNo"))}</TableCell>
              <TableCell>
                {sortLabel("billingDate", t("formLabel.invoiceDate"))}
              </TableCell>
              <TableCell>{t("formLabel.customerName")}</TableCell>
              <TableCell>{t("formLabel.phoneNumber")}</TableCell>
              <TableCell>{sortLabel("payment", t("formLabel.payment"))}</TableCell>
              <TableCell>{t("formLabel.GSTNumber")}</TableCell>
              <TableCell align="right">
                {sortLabel("total", t("formLabel.totalPrice"))}
              </TableCell>
              <TableCell align="right">{t("formLabel.balanceDue")}</TableCell>
              <TableCell align="right">{t("description.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <IMSTypography
                    textAlign="center"
                    lineHeight="80px"
                    color="natural.main"
                  >
                    {t("description.noDataFound")}
                  </IMSTypography>
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((data) => {
                const expanded = open === data.id;
                const balance = num(data?.balanceDue);
                return (
                  <React.Fragment key={data.id}>
                    <TableRow
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
                        <Tooltip title={t("buttonText.update")}>
                          <IconButton
                            onClick={() => navigate(`/?order/${data.id}`)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("buttonText.delete")}>
                          <IconButton
                            onClick={() => setConfirmDelete(data)}
                            color="error"
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t("buttonText.print")}>
                          <IconButton
                            color="primary"
                            onClick={() => generateReceipt(data)}
                          >
                            <PrintOutlined />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={10} sx={{ py: 0 }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{t("description.item_name")}</TableCell>
                                <TableCell>{t("description.item_qty")}</TableCell>
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
                            justifyContent="flex-end"
                            sx={{ py: 1, pr: 1 }}
                          >
                            <IMSTypography variant="body2">
                              {t("formLabel.subtotal")}: {settings.currencySymbol}
                              {formatMoney(data?.subtotal)}
                            </IMSTypography>
                            {num(data?.discountAmount) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.discountAmount")}: -
                                {settings.currencySymbol}
                                {formatMoney(data.discountAmount)}
                              </IMSTypography>
                            )}
                            {num(data?.GSTAmount) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.GSTAmount")}: {settings.currencySymbol}
                                {formatMoney(data.GSTAmount)}
                              </IMSTypography>
                            )}
                            {num(data?.amountPaid) > 0 && (
                              <IMSTypography variant="body2">
                                {t("formLabel.amountPay")}: {settings.currencySymbol}
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
              })
            )}
          </TableBody>
        </Table>
      </TableContainerStyle>
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
      />
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
        <IMSStack direction="row" spacing={2}>
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
