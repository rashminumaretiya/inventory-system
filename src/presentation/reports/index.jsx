import React, { useEffect, useState } from "react";
import IMSButton from "../../shared/IMSButton";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";
import ReactApexChart from "react-apexcharts";
import { ApiContainer } from "../../api";
import toast from "react-hot-toast";
import moment from "moment/moment";
import { useTranslation } from "react-i18next";
import IMSGrid from "../../shared/IMSGrid";
import { Card } from "@mui/material";
import IMSDatePicker from "../../shared/IMSDatePicker";
import IMSTypography from "../../shared/IMSTypography";
import dayjs from "dayjs";

const Reports = () => {
  const { t } = useTranslation();
  const { apiResponse } = ApiContainer();
  const [options, setOptions] = useState("all");
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState(dayjs());
  const [totalSale, setTotalSale] = useState(0);
  const [todaySale, setTodaySale] = useState(0);
  const [monthlySale, setMonthlySale] = useState(0);

  const endpoints = {
    product: "product",
    venders: "venders",
    orders: "orders",
  };

  const handleDownload = async () => {
    try {
      let combinedData = {};

      if (options === "all") {
        const fetchPromises = Object.entries(endpoints).map(
          async ([key, endpoint]) => {
            const response = await apiResponse(`/${endpoint}`, "GET");
            if (response.status !== 200) throw new Error(`${endpoint} failed`);
            return [key, response.data];
          }
        );
        const results = await Promise.all(fetchPromises);
        results.forEach(([key, data]) => {
          combinedData[key] = data;
        });
      } else {
        const response = await apiResponse(`/${options}`, "GET");
        if (response.success === false) throw new Error(`${options} failed`);
        combinedData = { [options]: response.data };
      }

      const jsonStr = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const today = dayjs().format("YYYY-MM-DD");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${today}_${
        options === "all" ? "all_reports" : options
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Error downloading JSON:", error);
    }
  };

  const getOrder = async () => {
    try {
      const response = await apiResponse("/orders", "GET");
      if (response.success) {
        setOrders(response.data);
      }
    } catch {
      toast.error("Something went wrong while fetching orders");
    }
  };

  useEffect(() => {
    getOrder();
  }, []);

  const [chartData, setChartData] = useState({
    series: [{ name: "Total Sales", data: [] }],
    options: {
      chart: {
        type: "area",
        height: 350,
        zoom: { enabled: true },
      },
      colors: ["#007881"],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth" },
      title: { text: t("description.salesByDate"), align: "left" },
      xaxis: { type: "datetime" },
      yaxis: { opposite: true },
      legend: { horizontalAlign: "left" },
    },
  });

  useEffect(() => {
    if (!orders.length) return;

    let filteredOrders = orders;

    if (startDate) {
      filteredOrders = orders.filter((order) => {
        const orderDate = dayjs(order.billingDate);
        return (
          orderDate.month() === startDate.month() &&
          orderDate.year() === startDate.year()
        );
      });
    }

    const grouped = filteredOrders.reduce((acc, order) => {
      const date = dayjs(order.billingDate).format("YYYY-MM-DD");
      acc[date] = (acc[date] || 0) + Number(order.total);
      return acc;
    }, {});

    const labels = Object.keys(grouped).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const seriesData = labels.map((date) => [
      new Date(date).getTime(),
      Number(grouped[date].toFixed(2)),
    ]);

    setChartData((prev) => ({
      ...prev,
      series: [{ name: t("description.totalSales"), data: seriesData }],
    }));
  }, [orders, startDate, t]);

  const handleChange = (e) => {
    setOptions(e.target.value);
  };

  const handleDateChange = (value) => {
    setStartDate(value);
  };
  console.log("startDate", startDate);
  useEffect(() => {
    const total = orders.reduce(
      (acc, order) => acc + Number(order?.total || 0),
      0
    );
    setTotalSale(total);

    const todayTotal = orders.reduce((acc, order) => {
      if (moment(order.billingDate).isSame(moment(), "day")) {
        return acc + Number(order?.total || 0);
      }
      return acc;
    }, 0);
    setTodaySale(todayTotal);
  }, [orders]);

  useEffect(() => {
    if (!startDate || !orders.length) {
      setMonthlySale(0);
      return;
    }

    const selectedMonth = moment(startDate.toDate());

    const monthTotal = orders.reduce((acc, order) => {
      const orderDate = moment(order.billingDate);
      if (
        orderDate.month() === selectedMonth.month() &&
        orderDate.year() === selectedMonth.year()
      ) {
        return acc + Number(order?.total || 0);
      }
      return acc;
    }, 0);

    setMonthlySale(monthTotal);
  }, [orders, startDate]);

  return (
    <>
      <IMSGrid container spacing={4}>
        <IMSGrid item md={8}>
          <Card
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            }}
          >
            <IMSDatePicker
              views={["year", "month"]}
              formLabel="Select Month"
              value={startDate}
              onChange={(newValue) => handleDateChange(newValue)}
            />
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="area"
              height={350}
            />
          </Card>
        </IMSGrid>
        <IMSGrid item md={4}>
          <IMSGrid container spacing={4}>
            <IMSGrid item md={12}>
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              >
                <IMSStack direction="row" spacing={2} alignItems="flex-end">
                  <IMSSelect
                    onChange={handleChange}
                    defaultValue="product"
                    formLabel="Download Report"
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
                  >
                    {t("buttonText.download")}
                  </IMSButton>
                </IMSStack>
              </Card>
            </IMSGrid>
            <IMSGrid item md={12}>
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              >
                <IMSTypography fontWeight={600}>
                  {startDate
                    ? `${startDate.format("MMMM")} Month Sale`
                    : "Current Month Sale"}
                </IMSTypography>
                <IMSTypography variant="h5" color="primary" fontWeight={600}>
                  ₹{monthlySale.toFixed(2)}
                </IMSTypography>
              </Card>
            </IMSGrid>
            <IMSGrid item md={6}>
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              >
                <IMSTypography fontWeight={600}>Total Sale</IMSTypography>
                <IMSTypography
                  variant="h5"
                  color="orange.main"
                  fontWeight={600}
                >
                  ₹{totalSale.toFixed(2)}
                </IMSTypography>
              </Card>
            </IMSGrid>
            <IMSGrid item md={6}>
              <Card
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
              >
                <IMSTypography fontWeight={600}>Today's Sale</IMSTypography>
                <IMSTypography
                  variant="h5"
                  color="success.main"
                  fontWeight={600}
                >
                  ₹{todaySale.toFixed(2)}
                </IMSTypography>
              </Card>
            </IMSGrid>
          </IMSGrid>
        </IMSGrid>
      </IMSGrid>
    </>
  );
};

export default Reports;
