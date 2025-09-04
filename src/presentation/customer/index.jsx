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
import React, { useEffect, useState } from "react";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import { ApiContainer } from "../../api";
import toast from "react-hot-toast";
import IMSTextField from "../../shared/IMSTextField";
import { Search } from "../../shared/icon";
import IMSGrid from "../../shared/IMSGrid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Edit } from "@mui/icons-material";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import { useSelector } from "react-redux";
import IMSStack from "../../shared/IMSStack";
import AddCustomer from "../dashboard/addCustomer";
import EditCustomer from "./editCustomer";
import { useTranslation } from "react-i18next";

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
    "& .MuiTableCell-root": {
      padding: 5,
      "& .MuiCollapse-wrapper": {
        backgroundColor: "#f7f7f7",
        "& .MuiTableHead-root": {
          "& .MuiTableCell-root": {
            backgroundColor: "transparent",
          },
        },
      },
    },
  },
}));

const Customer = () => {
  const { t } = useTranslation();
  const { apiResponse } = ApiContainer();
  const [customerList, setCustomerList] = useState([]);
  const [filterCustomerList, setFilterCustomerList] = useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [searchText, setSearchText] = useState("");
  const [show, setShow] = useState(false);
  const [deleteCustomer, setDeleteCustomer] = useState({});
  const [editData, setEditData] = useState({});
  const [editCustomerDialog, setEditCustomerDialog] = useState(false);
  const allCustomer = useSelector((state) => state?.customer?.user || []);

  const getOrders = async () => {
    try {
      const response = await apiResponse("/venders", "GET");
      if (response.success) {
        setCustomerList(response.data);
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  const applyFilters = () => {
    let searchList = [...customerList];
    if (searchText) {
      searchList = searchList.filter((el) =>
        el?.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    setFilterCustomerList(searchList);
    setPage(0);
  };
  const handleChange = (e) => {
    if (e?.target) {
      setSearchText(e.target.value);
    }
  };

  useEffect(() => {
    const uniqueProducts = [
      ...new Map(
        [...customerList, allCustomer].map((item) => [item.id, item])
      ).values(),
    ];
    setFilterCustomerList(uniqueProducts);
  }, [customerList, allCustomer]);

  const handleDeteleModal = (id) => {
    setDeleteCustomer({ show: true, id: id });
  };

  const handleDeleteCustomer = async (id) => {
    const filteredData = customerList.filter((item) => item.id === id);
    try {
      const response = await apiResponse(
        `/venders/${id}`,
        "DELETE",
        filteredData
      );
      if (response.success) {
        toast.success("Customer deleted successfully");
        setCustomerList(customerList.filter((item) => item.id !== id));
        setDeleteCustomer({ show: false });
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  const handleUpdateCustomer = (id) => {
    const editItem = filterCustomerList.find((item) => item.id === id);
    setEditData(editItem);
    setEditCustomerDialog(true);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, customerList]);

  const handleAddCustomer = () => {
    setShow(true);
  };

  return (
    <>
      <IMSGrid container justifyContent="space-between" spacing={3} mb={2}>
        <IMSGrid item md={4}>
          <IMSTextField
            variant="outlined"
            placeholder={t("description.search")}
            gutterNone
            name="search"
            onChange={handleChange}
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
          <IMSButton variant="contained" onClick={handleAddCustomer}>
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
              <TableCell>{t("description.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterCustomerList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
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
              filterCustomerList
                .sort((a, b) => a.itemName?.localeCompare(b.itemName))
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((data, i) => (
                  <>
                    <TableRow key={i} sx={{ cursor: "pointer" }}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{data?.name}</TableCell>
                      <TableCell>{data?.phone}</TableCell>
                      <TableCell>{data?.address}</TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleUpdateCustomer(data?.id)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeteleModal(data?.id)}
                          color="error"
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainerStyle>
      <TablePagination
        labelRowsPerPage={t("description.rowsPerPage")}
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={
          filterCustomerList ? filterCustomerList.length : customerList.length
        }
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <IMSDialog
        title={t("formLabel.addNewCustomer")}
        open={show}
        maxWidth="sm"
        handleClose={() => setShow(false)}
      >
        <AddCustomer />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.editCustomer")}
        open={editCustomerDialog}
        maxWidth="sm"
        handleClose={() => setEditCustomerDialog(false)}
      >
        <EditCustomer editData={editData} />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={deleteCustomer.show}
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
