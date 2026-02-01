import React from "react";
import DashboardStats from "./Ecommerce/Dashboard";
import { getAllSalesChannels } from "@/amerta/theme/utilities/get-all-sales-channels";

const baseClass = "before-dashboard";

const BeforeDashboard: React.FC = async () => {
  const salesChannels = await getAllSalesChannels();
  return (
    <div className={baseClass} style={{ height: "100%" }}>
      <DashboardStats salesChannels={salesChannels} />
    </div>
  );
};

export default BeforeDashboard;
