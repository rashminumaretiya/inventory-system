import React from "react";

import Layout from "../Layout";
import Customer from "../presentation/customer";
import Dashboard from "../presentation/dashboard";
import NotFound from "../presentation/notFound";
import Orders from "../presentation/orders";
import Product from "../presentation/product";
import Reports from "../presentation/reports";
import Settings from "../presentation/settings";

const publicRoutes = [
  {
    element: <Layout />,
    path: "/",
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/product", element: <Product /> },
      { path: "/orders", element: <Orders /> },
      { path: "/reports", element: <Reports /> },
      { path: "/customer", element: <Customer /> },
      { path: "/settings", element: <Settings /> },
      // Anything else rendered inside the layout rather than a blank page.
      { path: "*", element: <NotFound /> },
    ],
  },
];

const routes = [...publicRoutes];

export default routes;
