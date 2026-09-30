import { Edit } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
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
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { apiResponse } from "../../api";
import {
  customerRemoved,
  selectCustomers,
  setCustomers,
} from "../../store/slice/customerSlice";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSGrid from "../../shared/IMSGrid";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import { Search } from "../../shared/icon";
import AddCustomer from "../dashboard/addCustomer";
import EditCustomer from "./editCustomer";

export const TableContainerStyle = MUIStyled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 164px)",
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
    "& .MuiTableCell-root": { padding: 5 },
  },
}));

const Customer = () => {
  const { t } = useTranslation();
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

  const pageRows = visibleCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <IMSGrid container justifyContent="space-between" spacing={3} mb={2}>
        <IMSGrid item md={4}>
          <IMSTextField
            variant="outlined"
            placeholder={t("description.search")}
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
        <IMSGrid item md={4} textAlign="right">
          <IMSButton variant="contained" onClick={() => setShow(true)}>
            {t("buttonText.addCustomer")}
          </IMSButton>
        </IMSGrid>
      </IMSGrid>
      <Divider sx={{ mb: 3 }} />
      <TableContainerStyle>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t("formLabel.customerName")}</TableCell>
              <TableCell>{t("formLabel.phoneNumber")}</TableCell>
              <TableCell>{t("formLabel.customerAddress")}</TableCell>
              <TableCell align="right">{t("description.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
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
              pageRows.map((data, i) => (
                <TableRow key={data.id}>
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell>{data?.name}</TableCell>
                  <TableCell>{data?.phone}</TableCell>
                  <TableCell>{data?.address || "-"}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditData(data);
                        setEditCustomerDialog(true);
                      }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setDeleteCustomer({ show: true, id: data?.id })
                      }
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainerStyle>
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
        <IMSStack direction="row" spacing={2}>
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
