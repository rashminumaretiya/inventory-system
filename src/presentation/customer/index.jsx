import { Edit } from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSRecordCard from "../../shared/IMSRecordCard";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import { formatMoney } from "../../utils/billing";
import {
  customerKeyOfRecord,
  duesByCustomer,
  ordersForCustomer,
} from "../../utils/payments";
import { textMatches } from "../../utils/transliterate";
import useSettings from "../../utils/useSettings";
import {
  WHATSAPP_GREEN,
  openWhatsApp,
  reminderMessage,
} from "../../utils/whatsapp";
import FullHeightPage from "../../shared/FullHeightPage";
import PageHeader from "../../shared/PageHeader";
import PageToolbar from "../../shared/PageToolbar";
import { MUIStyled } from "../../shared/MUIStyled";
import {
  customerRemoved,
  selectCustomers,
  setCustomers,
} from "../../store/slice/customerSlice";
import AddCustomer from "../dashboard/addCustomer";
import CollectPayment from "../orders/collectPayment";
import EditCustomer from "./editCustomer";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  // Fills whatever height is left on the page and scrolls inside itself.
  flex: 1,
  minHeight: 0,
  // A frame around the whole table, matching the cards elsewhere.
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  // Tuck the last row's line under the frame, so the bottom edge is not
  // drawn twice.
  "& .MuiTable-root": { marginBottom: -1 },
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
    "& .MuiTableCell-root": { padding: "8px 10px" },
  },
}));

const Customer = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useDispatch();
  const customers = useSelector(selectCustomers);
  const location = useLocation();
  const { settings } = useSettings();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [show, setShow] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState({});
  const [editData, setEditData] = useState(null);
  const [editCustomerDialog, setEditCustomerDialog] = useState(false);
  const [orders, setOrders] = useState([]);
  const [duesOnly, setDuesOnly] = useState(false);
  const [collectFrom, setCollectFrom] = useState(null);

  // Quick Search can open this screen on a customer, or on Add Customer.
  useEffect(() => {
    if (location.state?.search) setSearchText(location.state.search);
    if (location.state?.add) setShow(true);
  }, [location.state]);

  const load = useCallback(async () => {
    try {
      // Bills too: what each customer still owes is worked out from them.
      const [response, orderRows] = await Promise.all([
        apiResponse("/venders", "GET"),
        apiResponse("/orders", "GET"),
      ]);
      if (response.success) dispatch(setCustomers(response.data));
      setOrders(orderRows?.data || []);
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [dispatch, t]);

  useEffect(() => {
    load();
  }, [load]);

  const dues = useMemo(() => duesByCustomer(orders), [orders]);
  const dueOf = (customer) => dues.get(customerKeyOfRecord(customer));
  const money = (value) => `${settings.currencySymbol}${formatMoney(value)}`;

  /**
   * Derived from the store rather than merged with it. The previous version
   * appended the whole redux slice as a single element, which put a blank row
   * in the table on first load.
   */
  const visibleCustomers = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return customers
      .filter((customer) => customer?.id)
      .filter((customer) =>
        term
          ? textMatches(customer.name, term) ||
            customer.phone?.includes(term)
          : true
      )
      .filter((customer) =>
        duesOnly ? dues.has(customerKeyOfRecord(customer)) : true
      )
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [customers, searchText, duesOnly, dues]);

  useEffect(() => setPage(0), [searchText, duesOnly]);

  /** Who owes anything, and how much in all — shown on the filter itself. */
  const owing = useMemo(() => {
    const owed = customers
      .filter((customer) => customer?.id)
      .map((customer) => dues.get(customerKeyOfRecord(customer)))
      .filter(Boolean);
    return {
      count: owed.length,
      amount: owed.reduce((sum, due) => sum + due.amount, 0),
    };
  }, [customers, dues]);

  const handleDeleteCustomer = async (id) => {
    try {
      const response = await apiResponse(`/venders/${id}`, "DELETE");
      if (response.success) {
        dispatch(customerRemoved(id));
        setDeleteCustomer({ show: false });
        toast.success(t("toast.customerDeleted"));
      }
    } catch {
      toast.error(t("toast.saveFailed"));
    }
  };

  const openEdit = (data) => {
    setEditData(data);
    setEditCustomerDialog(true);
  };

  const rowActions = (data) => {
    const due = dueOf(data);
    return (
      <>
        {/* Money first: collect it here, or nudge them on WhatsApp. */}
        {due && (
          <Tooltip title={t("buttonText.collect")}>
            <IconButton
              onClick={() =>
                setCollectFrom({
                  key: customerKeyOfRecord(data),
                  name: data?.name || "",
                })
              }
              color="success"
              size="small"
            >
              <CurrencyRupeeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {due && (
          <Tooltip title={t("whatsapp.remind")}>
            <IconButton
              size="small"
              sx={{ color: WHATSAPP_GREEN }}
              onClick={() =>
                openWhatsApp(
                  data?.phone,
                  reminderMessage(
                    { name: data?.name, amount: due.amount, count: due.bills },
                    { t, settings },
                  ),
                )
              }
            >
              <WhatsAppIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {data?.phone && (
          // On a phone this dials; on desktop it is harmless.
          <IconButton
            component="a"
            href={`tel:${data.phone}`}
            color="primary"
            size="small"
            aria-label={t("formLabel.phoneNumber")}
          >
            <PhoneIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton onClick={() => openEdit(data)} color="primary" size="small">
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          onClick={() => setDeleteCustomer({ show: true, id: data?.id })}
          color="error"
          size="small"
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </>
    );
  };

  const pageRows = visibleCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <FullHeightPage>
      <PageHeader
        title={t("menu.customer")}
        subtitle={t("pageSubtitle.customer")}
        divider={false}
        actions={
          <IMSButton variant="contained" onClick={() => setShow(true)}>
            {t("buttonText.addCustomer")}
          </IMSButton>
        }
      />
      <PageToolbar
        search={{
          value: searchText,
          onChange: (event) => setSearchText(event.target.value),
          placeholder: t("description.searchCustomers"),
        }}
        filters={
          <ToggleButtonGroup
            size="small"
            exclusive
            value={duesOnly}
            onChange={(event, next) => next !== null && setDuesOnly(next)}
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value={false}>{t("menu.all")}</ToggleButton>
            <ToggleButton value={true}>
              {t("description.withDues", {
                count: owing.count,
                amount: money(owing.amount),
              })}
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {pageRows.length === 0 ? (
        <IMSTypography
          textAlign="center"
          color="natural.main"
          sx={{ py: 6, flex: { md: 1 } }}
        >
          {t("description.noDataFound")}
        </IMSTypography>
      ) : isMobile ? (
        <IMSStack>
          {pageRows.map((data) => {
            const due = dueOf(data);
            return (
              <IMSRecordCard
                key={data.id}
                title={data?.name}
                subtitle={data?.phone}
                rows={[
                  ...(due
                    ? [
                        {
                          label: t("description.due"),
                          value: money(due.amount),
                          strong: true,
                          color: "error",
                        },
                      ]
                    : []),
                  ...(data?.address
                    ? [
                        {
                          label: t("formLabel.customerAddress"),
                          value: data.address,
                        },
                      ]
                    : []),
                ]}
                actions={rowActions(data)}
              />
            );
          })}
        </IMSStack>
      ) : (
        <TableContainerStyle>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t("formLabel.customerName")}</TableCell>
                <TableCell>{t("formLabel.phoneNumber")}</TableCell>
                <TableCell sx={{ whiteSpace: "normal" }}>
                  {t("formLabel.customerAddress")}
                </TableCell>
                <TableCell align="right">{t("description.due")}</TableCell>
                <TableCell align="right">{t("description.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((data, i) => {
                const due = dueOf(data);
                return (
                  <TableRow key={data.id} hover>
                    <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                    <TableCell>{data?.name}</TableCell>
                    <TableCell>{data?.phone}</TableCell>
                    <TableCell sx={{ whiteSpace: "normal" }}>
                      {data?.address || "-"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        whiteSpace: "nowrap",
                        fontWeight: due ? 600 : 400,
                        color: due ? "error.main" : "natural.main",
                      }}
                    >
                      {due ? money(due.amount) : "—"}
                    </TableCell>
                    <TableCell align="right">{rowActions(data)}</TableCell>
                  </TableRow>
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
        count={visibleCustomers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, next) => setPage(next)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(+event.target.value);
          setPage(0);
        }}
        sx={{
          flexShrink: 0,
          "& .MuiTablePagination-toolbar": { flexWrap: "wrap", rowGap: 0.5 },
        }}
      />

      <IMSDialog
        title={t("formLabel.addNewCustomer")}
        open={show}
        maxWidth="sm"
        handleClose={() => setShow(false)}
      >
        <AddCustomer onSaved={() => setShow(false)} />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.editCustomer")}
        open={editCustomerDialog}
        maxWidth="sm"
        handleClose={() => setEditCustomerDialog(false)}
      >
        <EditCustomer
          editData={editData}
          onSaved={() => setEditCustomerDialog(false)}
        />
      </IMSDialog>
      <IMSDialog
        title={t("buttonText.collect")}
        open={Boolean(collectFrom)}
        maxWidth="sm"
        handleClose={() => setCollectFrom(null)}
      >
        <CollectPayment
          customerName={collectFrom?.name}
          orders={ordersForCustomer(orders, collectFrom?.key)}
          onSaved={() => {
            setCollectFrom(null);
            load();
          }}
        />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={Boolean(deleteCustomer.show)}
        maxWidth="xs"
        handleClose={() => setDeleteCustomer({ show: false })}
      >
        <IMSTypography mb={2} color="natural.main">
          {t("description.deleteNote")}
        </IMSTypography>
        <IMSStack direction={{ xs: "column-reverse", sm: "row" }} spacing={1.5}>
          <IMSButton
            variant="outlined"
            color="black"
            onClick={() => setDeleteCustomer({ show: false })}
          >
            {t("buttonText.cancel")}
          </IMSButton>
          <IMSButton
            variant="contained"
            color="error"
            onClick={() => handleDeleteCustomer(deleteCustomer.id)}
          >
            {t("buttonText.delete")}
          </IMSButton>
        </IMSStack>
      </IMSDialog>
    </FullHeightPage>
  );
};

export default Customer;
