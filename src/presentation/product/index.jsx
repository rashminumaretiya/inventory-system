import {
  Chip,
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
import dayjs from "dayjs";
import IMSGrid from "../../shared/IMSGrid";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Edit } from "@mui/icons-material";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import AddProduct from "../dashboard/addProduct";
import { useDispatch, useSelector } from "react-redux";
import IMSStack from "../../shared/IMSStack";
import EditProduct from "./editProduct";
import { productData } from "../../store/slice/productSlice";
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

const Product = () => {
  const { t } = useTranslation();
  const { apiResponse } = ApiContainer();
  const [productList, setProductList] = useState([]);
  const [filterProductList, setFilterProductList] = useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [searchText, setSearchText] = useState("");
  const [billDate, setBillDate] = useState(null);
  const [show, setShow] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState({});
  const [editData, setEditData] = useState({});
  const [editProductDialog, setEditProductDialog] = useState(false);
  const allProducts = useSelector((state) => state?.product?.product || []);
  const dispatch = useDispatch();

  const getOrders = async () => {
    try {
      const response = await apiResponse("/product", "GET");
      if (response) {
        setProductList(response.data);
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
    const uniqueProducts = [
      ...new Map(
        [...productList, ...allProducts].map((item) => [item.id, item])
      ).values(),
    ];
    let searchList = [...uniqueProducts];
    if (searchText) {
      searchList = searchList.filter((el) =>
        el?.itemName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (billDate) {
      searchList = searchList.filter(
        (el) =>
          dayjs(el?.billingDate)?.$d.toLocaleDateString() ===
          billDate.toLocaleDateString()
      );
    }
    setFilterProductList(searchList);
    setPage(0);
  };

  const handleChange = (e) => {
    if (e?.target) {
      setSearchText(e.target.value);
    } else {
      setBillDate(e?.$d);
    }
  };

  useEffect(() => {
    const uniqueProducts = [
      ...new Map(
        [...productList, ...allProducts].map((item) => [item.id, item])
      ).values(),
    ];
    setFilterProductList(uniqueProducts);
  }, [productList, allProducts]);

  const handleDeteleModal = (id) => {
    setDeleteProduct({ show: true, id: id });
  };

  const handleDeleteProduct = async (id) => {
    const filteredData = productList.filter((item) => item.id === id);
    try {
      const response = await apiResponse(
        `/product/${id}`,
        "DELETE",
        filteredData
      );
      if (response) {
        toast.success("Product deleted successfully");
        setProductList(productList.filter((item) => item.id !== id));
        setDeleteProduct({ show: false });
        dispatch(
          productData({ payload: productList.filter((item) => item.id !== id) })
        );
      }
    } catch {
      toast.error("Something went wrong");
    }
  };
  const handleUpdateProduct = (id) => {
    const editItem = filterProductList.find((item) => item.id === id);
    setEditData(editItem);
    setEditProductDialog(true);
  };

  useEffect(() => {
    applyFilters();
  }, [searchText, billDate, productList]);

  const handleAddProduct = () => {
    setShow(true);
    dispatch(productData({ payload: productList }));
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
          <IMSButton variant="contained" onClick={handleAddProduct}>
            {t("buttonText.addProduct")}
          </IMSButton>
        </IMSGrid>
      </IMSGrid>
      <Divider sx={{ mb: 3 }} />
      <TableContainerStyle>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t("formLabel.productName")}</TableCell>
              <TableCell>{t("description.price")}</TableCell>
              <TableCell>{t("formLabel.stock")}</TableCell>
              <TableCell>{t("formLabel.status")}</TableCell>
              <TableCell>{t("description.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterProductList.length === 0 ? (
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
              filterProductList
                .sort((a, b) => a.itemName?.localeCompare(b.itemName))
                ?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((data, i) => (
                  <>
                    <TableRow key={i} sx={{ cursor: "pointer" }}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>{data?.itemName}</TableCell>
                      <TableCell>₹ {data?.price}</TableCell>
                      <TableCell>
                        {data?.stock}{" "}
                        <IMSTypography
                          color="natural.main"
                          variant="body2"
                          component="span"
                        >
                          {data?.quantityCategory}
                        </IMSTypography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={data?.stock <= 0 ? "error" : "success"}
                          size="small"
                          label={
                            data?.stock <= 0
                              ? t("description.outOfStock")
                              : t("description.inStock")
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          onClick={() => handleUpdateProduct(data?.id)}
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
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={
          filterProductList ? filterProductList.length : productList.length
        }
        rowsPerPage={rowsPerPage}
        labelRowsPerPage={t("description.rowsPerPage")}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <IMSDialog
        title={t("formLabel.addNewProduct")}
        open={show}
        maxWidth="sm"
        handleClose={() => setShow(false)}
      >
        <AddProduct />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.editProduct")}
        open={editProductDialog}
        maxWidth="sm"
        handleClose={() => setEditProductDialog(false)}
      >
        <EditProduct editData={editData} />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={deleteProduct.show}
        maxWidth="xs"
        handleClose={() => setDeleteProduct({ show: false })}
      >
        <IMSTypography mb={2} color="natural.main">
          {t("description.deleteNote")}
        </IMSTypography>
        <IMSStack direction="row" spacing={2}>
          <IMSButton
            variant="outlined"
            color="black"
            onClick={() => setDeleteProduct({ show: false })}
          >
            {t("buttonText.cancel")}
          </IMSButton>
          <IMSButton
            variant="contained"
            color="error"
            onClick={() => handleDeleteProduct(deleteProduct.id)}
          >
            {t("buttonText.delete")}
          </IMSButton>
        </IMSStack>
      </IMSDialog>
    </>
  );
};

export default Product;
