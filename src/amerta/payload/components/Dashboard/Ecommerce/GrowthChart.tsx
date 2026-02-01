"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts";
import styles from "./index.module.scss";
import { formatPrice } from "./Dashboard";
import { Currency } from "@/payload-types";

type Props = {
  data: any[]; // The same daily data passed to the main chart
  currency: Currency | null;
};

export const GrowthChart: React.FC<Props> = ({ data, currency }) => {
  const chartData = data.map((day) => ({
    date: day.date,
    value: day.sales > 0 ? day.sales / (day.orders || 1) : 0, // Assuming you add order count to chartData in API, otherwise just use sales
  }));

  const currentVal = chartData[chartData.length - 1]?.value || 0;

  return (
    <div className={styles.statCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Avg. Order Value Trend</span>
        <TrendingUp className={styles.iconTiny} />
      </div>

      <div className={styles.growthContainer}>
        <div className={styles.growthValue}>
          {formatPrice(currentVal, currency)}
          <span className={styles.growthLabel}>Today</span>
        </div>

        <div className={styles.sparkline}>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={data}>
              <Tooltip contentStyle={{ borderRadius: "4px", border: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", fontSize: "12px" }} formatter={(val?: number) => formatPrice(val || 0, currency)} labelStyle={{ display: "none" }} />
              <Line
                type="monotone"
                dataKey="sales" // Using Sales trend for now
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
