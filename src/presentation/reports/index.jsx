import { Card, Chip, Divider, LinearProgress } from "@mui/material";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import ReactApexChart from "react-apexcharts";

import { apiResponse } from "../../api";
import IMSButton from "../../shared/IMSButton";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSGrid from "../../shared/IMSGrid";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import IMSTypography from "../../shared/IMSTypography";
import {
  BACKUP_ENDPOINTS,
  downloadJson,
  lastBackupDate,
  runBackup,
} from "../../utils/backup";
import { formatMoney, formatQuantity } from "../../utils/billing";
import {
  grossProfit,
  inventoryValue,
  lowStockProducts,
  ordersInMonth,
  ordersOnDay,
  paymentBreakdown,
  salesByDate,
  sumTotals,
  topProducts,
} from "../../utils/reporting";
import useSettings from "../../utils/useSettings";

const cardSx = {
  p: 2,
  borderRadius: 2,
  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
  height: "100%",
};

const StatCard = ({ label, value, color = "primary", caption }) => (
  <Card elevation={0} sx={cardSx}>
    <IMSTypography fontWeight={600}>{label}</IMSTypography>
    <IMSTypography variant="h5" color={color} fontWeight={600}>
      {value}
    </IMSTypography>
    {caption && (
      <IMSTypography variant="body2" color="natural.main">
        {caption}
      </IMSTypography>
    )}
  </Card>
);

const Reports = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const currency = settings.currencySymbol;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [month, setMonth] = useState(dayjs());
  const [downloadOption, setDownloadOption] = useState("all");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState(lastBackupDate());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orderRows, productRows] = await Promise.all([
        apiResponse("/orders", "GET"),
        apiResponse("/product", "GET"),
      ]);
      setOrders(orderRows.data || []);
      setProducts(productRows.data || []);
    } catch {
      toast.error(t("toast.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const monthOrders = useMemo(() => ordersInMonth(orders, month), [orders, month]);
  const series = useMemo(() => salesByDate(monthOrders), [monthOrders]);
  const best = useMemo(() => topProducts(monthOrders, 5), [monthOrders]);
  const split = useMemo(() => paymentBreakdown(monthOrders), [monthOrders]);
  const profit = useMemo(
    () => grossProfit(monthOrders, products),
    [monthOrders, products]
  );
  const lowStock = useMemo(
    () => lowStockProducts(products, settings.lowStockThreshold),
    [products, settings.lowStockThreshold]
  );
  const stockValue = useMemo(() => inventoryValue(products), [products]);

  const totalSale = useMemo(() => sumTotals(orders), [orders]);
  const todaySale = useMemo(() => sumTotals(ordersOnDay(orders)), [orders]);
  const monthSale = useMemo(() => sumTotals(monthOrders), [monthOrders]);

  /** Chart options are rebuilt on language change so the title follows. */
  const chartOptions = useMemo(
    () => ({
      chart: { type: "area", height: 350, zoom: { enabled: true } },
      colors: ["#007881"],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      title: { text: t("description.salesByDate"), align: "left" },
      xaxis: { type: "datetime" },
      yaxis: {
        opposite: true,
        labels: { formatter: (value) => `${currency}${formatMoney(value)}` },
      },
      legend: { horizontalAlign: "left" },
      noData: { text: t("description.noDataFound") },
      tooltip: { x: { format: "dd MMM yyyy" } },
    }),
    [t, currency]
  );

  const chartSeries = useMemo(
    () => [
      {
        name: t("description.totalSales"),
        data: series.map((point) => [new Date(point.date).getTime(), point.total]),
      },
    ],
    [series, t]
  );

  const handleDownload = async () => {
    setBusy(true);
    try {
      if (downloadOption === "all") {
        const result = await runBackup({ force: true });
        setLastBackup(lastBackupDate());
        toast.success(
          t("toast.backupDownloadedCounts", {
            summary: Object.entries(result.counts || {})
              .map(([key, count]) => `${key}: ${count}`)
              .join(", "),
          })
        );
        return;
      }

      const endpoint = BACKUP_ENDPOINTS[downloadOption] || downloadOption;
      const response = await apiResponse(`/${endpoint}`, "GET");
      if (!response.success) throw new Error(endpoint);
      downloadJson(
        { [downloadOption]: response.data },
        `${dayjs().format("YYYY-MM-DD")}_${downloadOption}.json`
      );
      toast.success(t("toast.reportDownloaded"));
    } catch (error) {
      // The previous version passed the error as toast options, so the reason
      // was never shown.
      toast.error(t("toast.downloadFailed", { message: error.message || "" }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      <IMSGrid container spacing={3}>
        <IMSGrid item md={8}>
          <Card elevation={0} sx={cardSx}>
            <IMSDatePicker
              views={["year", "month"]}
              formLabel={t("formLabel.selectMonth")}
              value={month}
              onChange={(value) => value && setMonth(value)}
            />
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={350}
            />
          </Card>
        </IMSGrid>

        <IMSGrid item md={4}>
          <IMSGrid container spacing={3}>
            <IMSGrid item md={12}>
              <Card elevation={0} sx={cardSx}>
                <IMSStack direction="row" spacing={2} alignItems="flex-end">
                  <IMSSelect
                    onChange={(event) => setDownloadOption(event.target.value)}
                    value={downloadOption}
                    formLabel={t("formLabel.downloadReport")}
                    menu={[
                      { label: t("menu.all"), value: "all" },
                      { label: t("menu.product"), value: "product" },
                      { label: t("menu.customer"), value: "venders" },
                      { label: t("menu.orders"), value: "orders" },
                    ]}
                  />
                  <IMSButton
                    variant="contained"
                    sx={{ flex: "none" }}
                    onClick={handleDownload}
                    disabled={busy}
                  >
                    {t("buttonText.download")}
                  </IMSButton>
                </IMSStack>
                <IMSTypography variant="body2" color="natural.main">
                  {lastBackup
                    ? t("description.lastBackup", { date: lastBackup })
                    : t("description.noBackupYet")}
                </IMSTypography>
              </Card>
            </IMSGrid>

            <IMSGrid item md={12}>
              <StatCard
                label={
                  month
                    ? t("description.monthSale", { month: month.format("MMMM YYYY") })
                    : t("description.currentMonthSale")
                }
                value={`${currency}${formatMoney(monthSale)}`}
                caption={t("description.billCount", { count: monthOrders.length })}
              />
            </IMSGrid>
            <IMSGrid item md={6}>
              <StatCard
                label={t("description.totalSale")}
                value={`${currency}${formatMoney(totalSale)}`}
                color="orange.main"
              />
            </IMSGrid>
            <IMSGrid item md={6}>
              <StatCard
                label={t("description.todaySale")}
                value={`${currency}${formatMoney(todaySale)}`}
                color="success.main"
              />
            </IMSGrid>
          </IMSGrid>
        </IMSGrid>

        <IMSGrid item md={3}>
          <StatCard
            label={t("description.grossProfit")}
            value={`${currency}${formatMoney(profit.profit)}`}
            color="success.main"
            caption={t("description.profitCoverage", {
              coverage: formatMoney(profit.coverage),
            })}
          />
        </IMSGrid>
        <IMSGrid item md={3}>
          <StatCard
            label={t("description.outstanding")}
            value={`${currency}${formatMoney(split.outstanding)}`}
            color="error.main"
            caption={t("description.pendingBills")}
          />
        </IMSGrid>
        <IMSGrid item md={3}>
          <StatCard
            label={t("description.stockValueRetail")}
            value={`${currency}${formatMoney(stockValue.retail)}`}
          />
        </IMSGrid>
        <IMSGrid item md={3}>
          <StatCard
            label={t("description.stockValueCost")}
            value={`${currency}${formatMoney(stockValue.cost)}`}
            color="natural.main"
          />
        </IMSGrid>

        <IMSGrid item md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSTypography fontWeight={600} mb={1}>
              {t("description.paymentSplit")}
            </IMSTypography>
            <Divider sx={{ mb: 1 }} />
            {["Cash", "Online", "Pending"].map((mode) => (
              <IMSStack
                key={mode}
                direction="row"
                justifyContent="space-between"
                sx={{ py: 0.5 }}
              >
                <IMSTypography variant="body2">{mode}</IMSTypography>
                <IMSTypography variant="body2" fontWeight={600}>
                  {currency}
                  {formatMoney(split[mode])}
                </IMSTypography>
              </IMSStack>
            ))}
          </Card>
        </IMSGrid>

        <IMSGrid item md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSTypography fontWeight={600} mb={1}>
              {t("description.topProducts")}
            </IMSTypography>
            <Divider sx={{ mb: 1 }} />
            {best.length === 0 ? (
              <IMSTypography variant="body2" color="natural.main">
                {t("description.noDataFound")}
              </IMSTypography>
            ) : (
              best.map((item) => (
                <IMSStack
                  key={item.id || item.itemName}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 0.5 }}
                >
                  <IMSTypography variant="body2">
                    {item.itemName}{" "}
                    <IMSTypography
                      component="span"
                      variant="body2"
                      color="natural.main"
                    >
                      ({formatQuantity(item.quantity)} {item.unit})
                    </IMSTypography>
                  </IMSTypography>
                  <IMSTypography variant="body2" fontWeight={600}>
                    {currency}
                    {formatMoney(item.revenue)}
                  </IMSTypography>
                </IMSStack>
              ))
            )}
          </Card>
        </IMSGrid>

        <IMSGrid item md={4}>
          <Card elevation={0} sx={cardSx}>
            <IMSStack direction="row" alignItems="center" mb={1} gap={1}>
              <IMSTypography fontWeight={600}>
                {t("description.lowStockReport")}
              </IMSTypography>
              {lowStock.length > 0 && (
                <Chip size="small" color="warning" label={lowStock.length} />
              )}
            </IMSStack>
            <Divider sx={{ mb: 1 }} />
            {lowStock.length === 0 ? (
              <IMSTypography variant="body2" color="natural.main">
                {t("description.stockHealthy")}
              </IMSTypography>
            ) : (
              lowStock.slice(0, 8).map((item) => (
                <IMSStack
                  key={item.id}
                  direction="row"
                  justifyContent="space-between"
                  sx={{ py: 0.5 }}
                >
                  <IMSTypography variant="body2">{item.itemName}</IMSTypography>
                  <IMSTypography
                    variant="body2"
                    fontWeight={600}
                    color={item.stockInBase <= 0 ? "error" : "warning.main"}
                  >
                    {formatQuantity(item.stockInBase)} {item.unit}
                  </IMSTypography>
                </IMSStack>
              ))
            )}
          </Card>
        </IMSGrid>
      </IMSGrid>
    </>
  );
};

export default Reports;
