import React, { useState } from "react";
import IMSButton from "../../shared/IMSButton";
import IMSSelect from "../../shared/IMSSelect";
import IMSStack from "../../shared/IMSStack";

const Reports = () => {
  const [options, setOptions] = useState("product");

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
            const response = await fetch(`http://localhost:8000/${endpoint}`);
            if (!response.ok) throw new Error(`${endpoint} failed`);
            const data = await response.json();
            return [key, data];
          }
        );

        const results = await Promise.all(fetchPromises);
        results.forEach(([key, data]) => {
          combinedData[key] = data;
        });
      } else {
        const response = await fetch(`http://localhost:8000/${options}`);
        if (!response.ok) throw new Error(`${options} failed`);
        const data = await response.json();
        combinedData = { [options]: data };
      }

      const jsonStr = JSON.stringify(combinedData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${options === "all" ? "all_reports" : options}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading JSON:", error);
    }
  };

  const handleChange = (e) => {
    setOptions(e.target.value);
  };

  return (
    <>
      <IMSStack direction="row" spacing={2}>
        <IMSSelect
          onChange={handleChange}
          defaultValue="product"
          menu={[
            { label: "All", value: "all" },
            { label: "Product", value: "product" },
            { label: "Venders", value: "venders" },
            { label: "Orders", value: "orders" },
          ]}
        />
        <IMSButton variant="contained" onClick={handleDownload}>
          Download
        </IMSButton>
      </IMSStack>
    </>
  );
};

export default Reports;
