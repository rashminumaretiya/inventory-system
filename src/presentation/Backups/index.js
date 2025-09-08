import dayjs from "dayjs";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { ApiContainer } from "../../api";

const endpoints = {
  product: "product",
  venders: "venders",
  orders: "orders",
};

const Backups = () => {
  const { apiResponse } = ApiContainer();
  const handleDownload = async () => {
    try {
      let combinedData = {};

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

      const jsonStr = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const today = dayjs().format("YYYY-MM-DD");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${today}_all_reports.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Error downloading JSON:", error);
    }
  };
  useEffect(() => {
    const backupInterval = setInterval(() => {
      handleDownload();
    }, 24 * 3600 * 1000);
    return () => clearInterval(backupInterval);
  }, []);
};

export default Backups;
