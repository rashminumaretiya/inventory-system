import { Edit } from "@mui/icons-material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { apiResponse } from "../../api";
import {
  productRemoved,
  selectProducts,
  setProducts,
} from "../../store/slice/productSlice";
import IMSButton from "../../shared/IMSButton";
import IMSDialog from "../../shared/IMSDialog";
import IMSGrid from "../../shared/IMSGrid";
import IMSStack from "../../shared/IMSStack";
import IMSTextField from "../../shared/IMSTextField";
import IMSTypography from "../../shared/IMSTypography";
import { MUIStyled } from "../../shared/MUIStyled";
import { Search } from "../../shared/icon";
import {
  baseUnitOf,
  formatMoney,
  formatQuantity,
  num,
  productStockInBase,
} from "../../utils/billing";
import useSettings from "../../utils/useSettings";
import AddProduct from "../dashboard/addProduct";
import EditProduct from "./editProduct";

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
    "& .MuiTableCell-root": { padding: 5 },
  },
}));

/** out-of-stock | low | ok — drives the status chip and the filter. */
export const stockStatus = (product, threshold) => {
  const stock = productStockInBase(product);
  const limit = product?.lowStockAt ? num(product.lowStockAt) : num(threshold);
  if (stock <= 0) return "out";
  if (limit > 0 && stock <= limit) return "low";
  return "ok";
};

const Product = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const { settings } = useSettings();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [show, setShow] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState({});
  const [editData, setEditData] = useState(null);
  const [editProductDialog, setEditProductDialog] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await apiResponse("/product", "GET");
      if (response.success) dispatch(setProducts(response.data));
    } catch {
      toast.error(t("toast.loadFailed"));
    }
  }, [dispatch, t]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const result = { all: products.length, low: 0, out: 0 };
    products.forEach((product) => {
      const status = stockStatus(product, settings.lowStockThreshold);
      if (status === "low") result.low += 1;
      if (status === "out") result.out += 1;
    });
    return result;
  }, [products, settings.lowStockThreshold]);

  /** Derived, so the redux list is never sorted in place. */
  const visibleProducts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return products
      .filter((product) =>
        term ? product.itemName?.toLowerCase().includes(term) : true
      )
      .filter((product) =>
        statusFilter === "all"
          ? true
          : stockStatus(product, settings.lowStockThreshold) === statusFilter
      )
      .slice()
      .sort((a, b) => (a.itemName || "").localeCompare(b.itemName || ""));
  }, [products, searchText, statusFilter, settings.lowStockThreshold]);

  useEffect(() => setPage(0), [searchText, statusFilter]);

  const handleDeleteProduct = async (id) => {
    try {
      const response = await apiResponse(`/product/${id}`, "DELETE");
      if (response.success) {
        dispatch(productRemoved(id));
        setDeleteProduct({ show: false });
        toast.success(t("toast.productDeleted"));
      }
    } catch {
      toast.error(t("toast.saveFailed"));
    }
  };

  const statusChip = (product) => {
    const status = stockStatus(product, settings.lowStockThreshold);
    const config = {
      out: { color: "error", label: t("description.outOfStock") },
      low: { color: "warning", label: t("description.lowStock") },
      ok: { color: "success", label: t("description.inStock") },
    }[status];
    return <Chip color={config.color} size="small" label={config.label} />;
  };

  const pageRows = visibleProducts.slice(
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
        <IMSGrid item md={5}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={statusFilter}
            onChange={(event, next) => next && setStatusFilter(next)}
          >
            <ToggleButton value="all">
              {t("menu.all")} ({counts.all})
            </ToggleButton>
            <ToggleButton value="low" color="warning">
              {t("description.lowStock")} ({counts.low})
            </ToggleButton>
            <ToggleButton value="out" color="error">
              {t("description.outOfStock")} ({counts.out})
            </ToggleButton>
          </ToggleButtonGroup>
        </IMSGrid>
        <IMSGrid item md={3} textAlign="right">
          <IMSButton variant="contained" onClick={() => setShow(true)}>
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
              <TableCell align="right">{t("description.price")}</TableCell>
              <TableCell align="right">{t("formLabel.costPrice")}</TableCell>
              <TableCell align="right">{t("formLabel.stock")}</TableCell>
              <TableCell>{t("formLabel.status")}</TableCell>
              <TableCell align="right">{t("description.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
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
                  {/* Numbering continues across pages. */}
                  <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                  <TableCell>{data?.itemName}</TableCell>
                  <TableCell align="right">
                    {settings.currencySymbol}
                    {formatMoney(data?.price)}
                  </TableCell>
                  <TableCell align="right">
                    {data?.costPrice
                      ? `${settings.currencySymbol}${formatMoney(data.costPrice)}`
                      : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {formatQuantity(productStockInBase(data))}{" "}
                    <IMSTypography
                      color="natural.main"
                      variant="body2"
                      component="span"
                    >
                      {baseUnitOf(data?.quantityCategory)}
                    </IMSTypography>
                  </TableCell>
                  <TableCell>{statusChip(data)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => {
                        setEditData(data);
                        setEditProductDialog(true);
                      }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setDeleteProduct({ show: true, id: data?.id })
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
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={visibleProducts.length}
        rowsPerPage={rowsPerPage}
        labelRowsPerPage={t("description.rowsPerPage")}
        page={page}
        onPageChange={(event, next) => setPage(next)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(+event.target.value);
          setPage(0);
        }}
      />
      <IMSDialog
        title={t("formLabel.addNewProduct")}
        open={show}
        maxWidth="sm"
        handleClose={() => setShow(false)}
      >
        <AddProduct onSaved={() => setShow(false)} />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.editProduct")}
        open={editProductDialog}
        maxWidth="sm"
        handleClose={() => setEditProductDialog(false)}
      >
        <EditProduct
          editData={editData}
          onSaved={() => setEditProductDialog(false)}
        />
      </IMSDialog>
      <IMSDialog
        title={t("formLabel.areYouSure")}
        open={Boolean(deleteProduct.show)}
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
