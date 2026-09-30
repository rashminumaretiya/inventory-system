import { Edit } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PhoneIcon from "@mui/icons-material/PhoneOutlined";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSRecordCard from "../../shared/IMSRecordCard";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import PageHeader from "../../shared/PageHeader";
import PageToolbar from "../../shared/PageToolbar";
import { MUIStyled } from "../../shared/MUIStyled";
import {
  customerRemoved,
  selectCustomers,
  setCustomers,
} from "../../store/slice/customerSlice";
import AddCustomer from "../dashboard/addCustomer";
import EditCustomer from "./editCustomer";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 240px)",
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

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [show, setShow] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState({});
  const [editData, setEditData] = useState(null);
  const [editCustomerDialog, setEditCustomerDialog] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiResponse("/venders", "GET");
      if (response.success) dispatch(setCustomers(response.data));
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [dispatch, t]);

  useEffect(() => {
    load();
  }, [load]);

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
          ? customer.name?.toLowerCase().includes(term) ||
            customer.phone?.includes(term)
          : true
      )
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [customers, searchText]);

  useEffect(() => setPage(0), [searchText]);

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

  const rowActions = (data) => (
    <>
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

  const pageRows = visibleCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
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
      />

      {pageRows.length === 0 ? (
        <IMSTypography textAlign="center" color="natural.main" sx={{ py: 6 }}>
          {t("description.noDataFound")}
        </IMSTypography>
      ) : isMobile ? (
        <IMSStack>
          {pageRows.map((data) => (
            <IMSRecordCard
              key={data.id}
              title={data?.name}
              subtitle={data?.phone}
              rows={
                data?.address
                  ? [{ label: t("formLabel.customerAddress"), value: data.address }]
                  : []
              }
              actions={rowActions(data)}
            />
          ))}
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
                <TableCell align="right">{t("description.action")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((data, i) => (
                <TableRow key={data.id} hover>
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell>{data?.name}</TableCell>
                  <TableCell>{data?.phone}</TableCell>
                  <TableCell sx={{ whiteSpace: "normal" }}>
                    {data?.address || "-"}
                  </TableCell>
                  <TableCell align="right">{rowActions(data)}</TableCell>
                </TableRow>
              ))}
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
    </>
  );
};

export default Customer;
