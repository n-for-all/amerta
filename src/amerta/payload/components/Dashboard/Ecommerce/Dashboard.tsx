"use client";

import React, { useState, useEffect } from "react";
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from "recharts";
import { Loader2, ChevronDown, Store } from "lucide-react";
import styles from "./index.module.scss";

import { Currency, SalesChannel } from "@/payload-types";
import { DashboardEmptyState } from "./DashboardEmpty";
import { TopProducts } from "./TopProducts";
import { GrowthChart } from "./GrowthChart";

export const formatPrice = (price: number, currency: Currency | null): string => {
  const finalPrice = price || 0;
  return (currency?.symbol || "$") + " " + finalPrice.toFixed(2);
};

const DashboardStats: React.FC<{ salesChannels: SalesChannel[] }> = ({ salesChannels }) => {
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    ordersCount: 0,
    grossSales: 0,
    netRevenue: 0,
    customersCount: 0,
    sessions: 0,
  });

  const [currency, setCurrency] = useState<Currency | null>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);

  // Dropdown States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0]!,
    to: new Date().toISOString().split("T")[0]!,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });

      // If we have a specific channel selected, send it.
      // Otherwise API might default to "All" or "Primary" depending on your logic.
      if (activeChannelId) {
        queryParams.append("channel", activeChannelId);
      }

      const res = await fetch(`/api/stats/dashboard?${queryParams.toString()}`);

      if (res.status === 404 || res.status === 400) {
        setShowEmptyState(true);
        return;
      }

      const json = await res.json();

      if (res.ok) {
        setData(json.chartData);
        setMetrics(json.metrics);
        setCurrency(json.currency);

        // Only set active ID from API if we don't have one selected yet
        if (!activeChannelId && json.salesChannelId) {
          setActiveChannelId(json.salesChannelId);
        }

        setTopProducts(json.topProducts || []);
        setShowEmptyState(false);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when Date OR Channel changes
  useEffect(() => {
    fetchData();
  }, [dateRange, activeChannelId]);

  // Helper to get channel label
  const activeChannelName = salesChannels.find((c) => c.id === activeChannelId)?.name || "All Channels";

  if (showEmptyState) {
    return (
      <div className={styles.dashboardContainer}>
        <DashboardEmptyState />
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContainerInner}>
        <div className={styles.header}>
          <h2 className={styles.title}>Analytics</h2>
          <div className={styles.controls}>
            {/* --- Date Picker --- */}
            <div className={styles.dropdownWrapper}>
              <button
                className={styles.controlBtn}
                onClick={() => {
                  setShowDatePicker(!showDatePicker);
                  setShowChannelPicker(false);
                }}
              >
                <span className={styles.icon}>📅</span>
                {showDatePicker ? "Close" : "Date Range"}
              </button>

              {showDatePicker && (
                <div className={styles.dropdownPopup}>
                  <input type="date" value={dateRange.from} onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))} className={styles.dateInput} />
                  <span className={styles.separator}>-</span>
                  <input type="date" value={dateRange.to} onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))} className={styles.dateInput} />
                </div>
              )}
            </div>

            {/* --- Sales Channel Picker --- */}
            <div className={styles.dropdownWrapper}>
              <button
                className={styles.controlBtn}
                onClick={() => {
                  setShowChannelPicker(!showChannelPicker);
                  setShowDatePicker(false);
                }}
              >
                <Store className={styles.iconSmall} />
                <span>{activeChannelName}</span>
                <ChevronDown className={styles.iconTiny} />
              </button>

              {showChannelPicker && (
                <div className={styles.dropdownPopup}>
                  <div className={styles.channelList}>
                    {/* Optional: 'All Channels' option */}
                    <button
                      className={`${styles.channelOption} ${!activeChannelId ? styles.active : ""}`}
                      onClick={() => {
                        setActiveChannelId(null); // Or however your API handles "All"
                        setShowChannelPicker(false);
                      }}
                    >
                      All Channels
                    </button>

                    {salesChannels.map((channel) => (
                      <button
                        key={channel.id}
                        className={`${styles.channelOption} ${activeChannelId === channel.id ? styles.active : ""}`}
                        onClick={() => {
                          setActiveChannelId(channel.id);
                          setShowChannelPicker(false);
                        }}
                      >
                        {channel.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {/* Total Orders */}
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Total Orders</span>
            </div>
            <div className={styles.cardValue}>{isLoading ? <Loader2 className={styles.spinner} /> : metrics.ordersCount}</div>
          </div>

          {/* Total Sales */}
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Total Sales</span>
            </div>
            <div className={styles.cardValue}>{isLoading ? <Loader2 className={styles.spinner} /> : formatPrice(metrics.grossSales, currency)}</div>
            <div className={styles.subMetricsContainer} style={{ display: "none" }}>
              <div className={styles.subMetric}>
                <span className={styles.subLabel}>Revenue</span>
                <span className={styles.subValue}>{formatPrice(metrics.netRevenue, currency)}</span>
              </div>
              <div className={styles.subMetric}>
                <span className={styles.subLabel}>Gross</span>
                <span className={styles.subValue}>{formatPrice(metrics.grossSales, currency)}</span>
              </div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Customers</span>
            </div>
            <div className={styles.cardValue}>{isLoading ? <Loader2 className={styles.spinner} /> : metrics.customersCount}</div>
          </div>
          {/* <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Sessions</span>
            </div>
            <div className={styles.cardValue}>
              {metrics.sessions === 0 ? "-" : metrics.sessions}
              <span className={styles.trendNeutral}>(Requires GA4)</span>
            </div>
          </div> */}
        </div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E1E3E5" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#6D7175", fontSize: 12 }} dy={10} minTickGap={30} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6D7175", fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(2)}k`} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#colorSales)" strokeWidth={2} activeDot={{ r: 6, strokeWidth: 0 }} name="Total Sales" />
              <Line type="monotone" dataKey="payments" stroke="#8C9196" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Payments Collected" />
            </ComposedChart>
          </ResponsiveContainer>

          <div className={styles.chartLegend}>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#3b82f6" }}></span>
              Total Sales
            </div>
            <div className={styles.legendItem}>
              <span className={styles.dot} style={{ background: "#8C9196" }}></span>
              Payments Collected
            </div>
          </div>
        </div>
        <div className={styles.secondaryGrid}>
          <TopProducts products={topProducts} currency={currency} />
          <GrowthChart data={data} currency={currency} />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
