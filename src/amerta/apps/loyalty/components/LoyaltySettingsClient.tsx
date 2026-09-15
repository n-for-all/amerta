"use client";

import React, { useState, useEffect } from "react";
import { Gutter, toast } from "@payloadcms/ui";
import {
  Award,
  Users,
  ShoppingBag,
  Sliders,
  Gift,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { LoyaltySettings, LoyaltyTier } from "../types";
import { DEFAULT_LOYALTY_SETTINGS } from "../services/loyaltyEngine";
import "./loyalty-admin.scss";

export const LoyaltySettingsClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"customers" | "orders" | "rules" | "tiers" | "rewards">("customers");
  const [settings, setSettings] = useState<LoyaltySettings>(DEFAULT_LOYALTY_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Customer Manager state
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Quick edit customer name in modal
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [savingCustomerName, setSavingCustomerName] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Store Currency State (defaults to AED)
  const [storeCurrency, setStoreCurrency] = useState<{ code: string; symbol: string }>({
    code: "AED",
    symbol: "AED",
  });

  // Fetch sales channel currency on mount
  useEffect(() => {
    fetch("/api/sales-channel?limit=10&depth=2")
      .then((res) => res.json())
      .then((data) => {
        const channels = data.docs || [];
        const activeChannel = channels.find((sc: any) => sc.isDefault) || channels[0];
        if (activeChannel && Array.isArray(activeChannel.currencies)) {
          const defCurr = activeChannel.currencies.find((c: any) => c.isDefault) || activeChannel.currencies[0];
          if (defCurr) {
            const currObj = typeof defCurr.currency === "object" ? defCurr.currency : null;
            if (currObj?.code) {
              setStoreCurrency({
                code: currObj.code,
                symbol: currObj.symbolNative || currObj.symbol || currObj.code,
              });
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch settings on mount
  useEffect(() => {
    fetch("/api/loyalty/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
        }
        setLoadingSettings(false);
      })
      .catch((err) => {
        console.error("Failed to load loyalty settings:", err);
        setLoadingSettings(false);
      });
  }, []);

  // Fetch customers
  const fetchCustomers = (query: string = "") => {
    setSearchingCustomers(true);
    fetch(`/api/loyalty/admin/customers?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.customers) {
          setCustomers(data.customers);
        }
        setSearchingCustomers(false);
      })
      .catch((err) => {
        console.error("Error searching customers:", err);
        setSearchingCustomers(false);
      });
  };

  const fetchOrders = (query: string = "") => {
    setLoadingOrders(true);
    fetch(`/api/loyalty/admin/orders?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.orders) {
          setOrders(data.orders);
        }
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error("Error fetching loyalty orders:", err);
        setLoadingOrders(false);
      });
  };

  useEffect(() => {
    fetchCustomers("");
    fetchOrders("");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handleOrderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(orderSearchQuery);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/loyalty/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Loyalty settings updated successfully!");
      } else {
        toast.error(data.error || "Failed to update settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleOpenCustomerModal = (cust: any) => {
    setSelectedCustomer(cust);
    setEditFirstName(cust.firstName || "");
    setEditLastName(cust.lastName || "");
    setEditDisplayName(cust.displayName || "");
    setAdjustPointsDelta(100);
    setAdjustReason("");
  };

  const handleSaveCustomerName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setSavingCustomerName(true);
    try {
      const computedDisplay = editDisplayName || `${editFirstName} ${editLastName}`.trim() || selectedCustomer.email;
      const res = await fetch("/api/loyalty/admin/update-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          firstName: editFirstName,
          lastName: editLastName,
          displayName: computedDisplay,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Customer profile updated successfully!");
        fetchCustomers(searchQuery);
        setSelectedCustomer((prev: any) =>
          prev
            ? {
                ...prev,
                firstName: editFirstName,
                lastName: editLastName,
                displayName: computedDisplay,
                hasName: Boolean(editDisplayName || editFirstName || editLastName),
              }
            : null
        );
      } else {
        toast.error(data.error || "Failed to update customer profile");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer profile");
    } finally {
      setSavingCustomerName(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setAdjusting(true);
    try {
      const res = await fetch("/api/loyalty/admin/adjust-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          pointsDelta: Number(adjustPointsDelta),
          reason: adjustReason || "Manual adjustment by Admin",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully adjusted points for ${selectedCustomer.displayName || selectedCustomer.email}`);
        setSelectedCustomer(null);
        setAdjustReason("");
        fetchCustomers(searchQuery);
      } else {
        toast.error(data.error || "Failed to adjust points");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust points");
    } finally {
      setAdjusting(false);
    }
  };

  const handleTierChange = (index: number, field: keyof LoyaltyTier, value: any) => {
    const updatedTiers = [...settings.tiers];
    const target = updatedTiers[index];
    if (!target) return;
    updatedTiers[index] = {
      ...target,
      [field]: value,
    };
    setSettings({ ...settings, tiers: updatedTiers });
  };

  return (
    <Gutter className="loyalty-dashboard">
      {/* Header */}
      <div className="loyalty-header">
        <div className="loyalty-title">
          <h1>
            <Award size={28} color="#d97706" />
            Loyalty & VIP Circle
          </h1>
          <p>Configure points earning, redemption rates, VIP tiers, and customer reward accounts.</p>
        </div>

        <div className="loyalty-header-actions">
          <label className="loyalty-status-toggle">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            />
            <span>{settings.enabled ? "PROGRAM ACTIVE" : "PROGRAM PAUSED"}</span>
          </label>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={savingSettings || loadingSettings}
            className="loyalty-btn-primary"
          >
            {savingSettings ? "SAVING..." : "SAVE SETTINGS"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="loyalty-tabs">
        <button
          type="button"
          onClick={() => setActiveTab("customers")}
          className={`loyalty-tab-btn ${activeTab === "customers" ? "active" : ""}`}
        >
          <Users size={16} />
          Customer Manager
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`loyalty-tab-btn ${activeTab === "orders" ? "active" : ""}`}
        >
          <ShoppingBag size={16} />
          Orders & Points
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`loyalty-tab-btn ${activeTab === "rules" ? "active" : ""}`}
        >
          <Sliders size={16} />
          Rules & Earning
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("tiers")}
          className={`loyalty-tab-btn ${activeTab === "tiers" ? "active" : ""}`}
        >
          <Award size={16} />
          VIP Tier Ladder
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("rewards")}
          className={`loyalty-tab-btn ${activeTab === "rewards" ? "active" : ""}`}
        >
          <Gift size={16} />
          Rewards & Bonuses
        </button>
      </div>

      {/* Tab 1: Customer Manager */}
      {activeTab === "customers" && (
        <div>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="loyalty-search-bar">
            <div className="loyalty-search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search customers by Name, Email, or Order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={searchingCustomers}
              className="loyalty-btn-search"
            >
              {searchingCustomers ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                fetchCustomers("");
              }}
              className="loyalty-btn-refresh"
              title="Reset Search"
            >
              <RefreshCw size={16} />
            </button>
          </form>

          {/* Customer Table */}
          <div className="loyalty-table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>VIP Tier</th>
                  <th className="text-right">Available Points</th>
                  <th className="text-right">Lifetime Points</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--theme-elevation-500)" }}>
                      {searchingCustomers ? "Searching customers..." : "No customers found."}
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        {cust.hasName ? (
                          <a
                            href={`/admin/collections/customers/${cust.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cust-link"
                            title="Click to view & edit customer in Admin"
                          >
                            {cust.displayName}
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <a
                            href={`/admin/collections/customers/${cust.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="cust-link"
                            style={{ color: "var(--theme-elevation-500)", fontStyle: "italic" }}
                            title="No name set - Click to edit in Admin"
                          >
                            (No name set)
                            <ExternalLink size={11} />
                          </a>
                        )}
                        <div className="cust-email">{cust.email}</div>
                      </td>
                      <td>
                        <span
                          className="tier-badge"
                          style={{
                            borderColor: cust.currentTier?.color || "#b45309",
                            color: cust.currentTier?.color || "#b45309",
                          }}
                        >
                          {cust.currentTier?.name || "Bronze Member"}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {cust.account?.points?.toLocaleString() || 0} pts
                      </td>
                      <td className="text-right" style={{ fontFamily: "monospace", color: "var(--theme-elevation-500)" }}>
                        {cust.account?.lifetimePoints?.toLocaleString() || 0} pts
                      </td>
                      <td className="text-right">
                        <div className="actions-wrap">
                          <a
                            href={`/admin/collections/customers/${cust.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-edit-link"
                            title="Open Customer Profile in Admin"
                          >
                            Edit <ExternalLink size={10} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerModal(cust)}
                            className="btn-adjust"
                          >
                            Points
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Details & Points Adjustment Modal */}
          {selectedCustomer && (
            <div className="loyalty-modal-overlay">
              <div className="loyalty-modal" style={{ maxWidth: "520px" }}>
                <div className="modal-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <h3>Customer Profile & Points</h3>
                    <a
                      href={`/admin/collections/customers/${selectedCustomer.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-edit-link"
                      style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
                    >
                      Admin Page <ExternalLink size={10} />
                    </a>
                  </div>
                  <button type="button" onClick={() => setSelectedCustomer(null)}>✕</button>
                </div>

                <div className="modal-info">
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                  <div>
                    <strong>VIP Tier:</strong>{" "}
                    <span style={{ color: selectedCustomer.currentTier?.color || "#b45309", fontWeight: 700 }}>
                      {selectedCustomer.currentTier?.name}
                    </span>{" "}
                    ({selectedCustomer.currentTier?.multiplier}x Multiplier)
                  </div>
                  <div><strong>Current Balance:</strong> {selectedCustomer.account?.points || 0} pts</div>
                </div>

                {/* Section 1: Edit Customer Name */}
                <form onSubmit={handleSaveCustomerName} style={{ marginBottom: "1.25rem", paddingBottom: "1.25rem", borderBottom: "1px solid var(--theme-elevation-150)" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.75rem", color: "var(--theme-elevation-800)" }}>
                    Update Customer Name
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editFirstName}
                        onChange={(e) => setEditFirstName(e.target.value)}
                        placeholder="First Name"
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "1px solid var(--theme-elevation-200)",
                          background: "var(--theme-input-bg, var(--theme-elevation-50))",
                          color: "var(--theme-text)",
                          borderRadius: 0,
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editLastName}
                        onChange={(e) => setEditLastName(e.target.value)}
                        placeholder="Last Name"
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "1px solid var(--theme-elevation-200)",
                          background: "var(--theme-input-bg, var(--theme-elevation-50))",
                          color: "var(--theme-text)",
                          borderRadius: 0,
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        placeholder="e.g. John Doe"
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.75rem",
                          border: "1px solid var(--theme-elevation-200)",
                          background: "var(--theme-input-bg, var(--theme-elevation-50))",
                          color: "var(--theme-text)",
                          borderRadius: 0,
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingCustomerName}
                      className="btn-cancel"
                      style={{ padding: "0.5rem 0.85rem", whiteSpace: "nowrap" }}
                    >
                      {savingCustomerName ? "Saving..." : "Save Name"}
                    </button>
                  </div>
                </form>

                {/* Section 2: Adjust Points */}
                <form onSubmit={handleAdjustPoints}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.75rem", color: "var(--theme-elevation-800)" }}>
                    Adjust Points Balance
                  </div>

                  <div className="form-group" style={{ marginBottom: "0.85rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                      Points Delta (Use negative to deduct)
                    </label>
                    <input
                      type="number"
                      value={adjustPointsDelta}
                      onChange={(e) => setAdjustPointsDelta(Number(e.target.value))}
                      placeholder="e.g. 100 or -50"
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        fontFamily: "monospace",
                        borderRadius: 0,
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                      Reason / Note
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="e.g. Delayed delivery compensation"
                      required
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        borderRadius: 0,
                      }}
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="btn-cancel"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={adjusting}
                      className="btn-confirm"
                    >
                      {adjusting ? "Updating..." : "Confirm Points Adjustment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Orders & Points */}
      {activeTab === "orders" && (
        <div>
          {/* Search bar */}
          <form onSubmit={handleOrderSearchSubmit} className="loyalty-search-bar">
            <div className="loyalty-search-input-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search orders by Order ID, Customer Name, or Email..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loadingOrders}
              className="loyalty-btn-search"
            >
              {loadingOrders ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderSearchQuery("");
                fetchOrders("");
              }}
              className="loyalty-btn-refresh"
              title="Reset Search"
            >
              <RefreshCw size={16} />
            </button>
          </form>

          {/* Orders Table */}
          <div className="loyalty-table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="text-right">Total ({storeCurrency.code})</th>
                  <th className="text-right">Points Earned</th>
                  <th className="text-right">Points Redeemed</th>
                  <th>Status</th>
                  <th className="text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--theme-elevation-500)" }}>
                      {loadingOrders ? "Loading orders..." : "No orders found."}
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--theme-text)" }}>
                          {ord.orderId}
                        </span>
                      </td>
                      <td>
                        <div className="cust-name">
                          {ord.customerName}
                          {ord.isGuest && (
                            <span style={{ marginLeft: "0.5rem", fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "var(--theme-elevation-150)", color: "var(--theme-elevation-600)", fontWeight: 700 }}>
                              GUEST
                            </span>
                          )}
                        </div>
                        <div className="cust-email">{ord.customerEmail}</div>
                      </td>
                      <td className="text-right" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                        {Number(ord.total || 0).toFixed(2)} {storeCurrency.code}
                      </td>
                      <td className="text-right" style={{ fontFamily: "monospace", fontWeight: 700, color: ord.pointsEarned > 0 ? "#10b981" : "var(--theme-elevation-500)" }}>
                        {ord.pointsEarned > 0 ? `+${ord.pointsEarned} pts` : "0 pts"}
                      </td>
                      <td className="text-right" style={{ fontFamily: "monospace", fontWeight: 700, color: ord.pointsRedeemed > 0 ? "#d97706" : "var(--theme-elevation-500)" }}>
                        {ord.pointsRedeemed > 0 ? `-${ord.pointsRedeemed} pts` : "0 pts"}
                      </td>
                      <td>
                        <span className={`status-pill ${ord.status}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontSize: "0.75rem", color: "var(--theme-elevation-500)", whiteSpace: "nowrap" }}>
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Rules & Earning */}
      {activeTab === "rules" && (
        <div className="loyalty-cards-grid">
          <div className="loyalty-card">
            <h3 className="loyalty-card-title">
              <Sliders size={18} color="#d97706" />
              Earning Configuration
            </h3>
            <p className="loyalty-card-desc">
              Define the base rate at which customers earn points on checkout subtotals.
            </p>

            <div className="form-group">
              <label>Base Earning Rate (Points per 1 {storeCurrency.code})</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={settings.earningRate}
                onChange={(e) => setSettings({ ...settings, earningRate: Number(e.target.value) })}
              />
              <p className="help-text">Example: 1 means spending 1.00 {storeCurrency.code} grants 1 point (before VIP multiplier).</p>
            </div>

            <div className="form-group">
              <label>Single Order Collect Limit (Max points per order)</label>
              <input
                type="number"
                min="100"
                value={settings.collectLimit || 5000}
                onChange={(e) => setSettings({ ...settings, collectLimit: Number(e.target.value) })}
              />
              <p className="help-text">Cap maximum points a buyer can accumulate from an individual purchase.</p>
            </div>
          </div>

          <div className="loyalty-card">
            <h3 className="loyalty-card-title">
              <Award size={18} color="#d97706" />
              Redemption & Discounts
            </h3>
            <p className="loyalty-card-desc">
              Define how much store credit / discount points are worth when redeemed in checkout.
            </p>

            <div className="form-group">
              <label>Redemption Value ({storeCurrency.code} Discount per 100 Points)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={settings.redemptionRate}
                onChange={(e) => setSettings({ ...settings, redemptionRate: Number(e.target.value) })}
              />
              <p className="help-text">Example: 5 means 100 points = 5.00 {storeCurrency.code} discount off current order total.</p>
            </div>

            <div className="form-group">
              <div className="input-row">
                <div>
                  <label>Min Redeem Points</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={settings.minRedeemPoints}
                    onChange={(e) => setSettings({ ...settings, minRedeemPoints: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label>Max Redeem Points</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={settings.maxRedeemPoints || 2000}
                    onChange={(e) => setSettings({ ...settings, maxRedeemPoints: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Storefront Display Messages */}
          <div className="loyalty-card" style={{ gridColumn: "1 / -1" }}>
            <h3 className="loyalty-card-title">
              <Sparkles size={18} color="#d97706" />
              Storefront Display Messages
            </h3>
            <p className="loyalty-card-desc">
              Customize the promotional messages displayed on the Product Detail Page and Checkout. Use <strong>%s</strong> as the placeholder where the calculated points will appear. All messages are automatically wrapped with translate (<code>__</code>) for multilingual stores.
            </p>

            <div className="form-group">
              <label>Product Detail Page Message</label>
              <input
                type="text"
                value={settings.productPointsMessage || ""}
                placeholder="Loyalty Circle: Earn %s reward points on this item and level up your VIP tier."
                onChange={(e) =>
                  setSettings({ ...settings, productPointsMessage: e.target.value })
                }
              />
              <p className="help-text">
                Displayed under the product price. Use <code>%s</code> for the points amount. Example: <em>Loyalty Circle: Earn %s reward points on this item and level up your VIP tier.</em>
              </p>
            </div>

            <div className="form-group">
              <label>Checkout Message (Guest Customer)</label>
              <input
                type="text"
                value={settings.checkoutPointsMessage || ""}
                placeholder="Sign in or create an account to earn ~%s points and unlock VIP perks with Loyalty Circle."
                onChange={(e) =>
                  setSettings({ ...settings, checkoutPointsMessage: e.target.value })
                }
              />
              <p className="help-text">
                Displayed in the order summary for guest shoppers. Use <code>%s</code> for the estimated points.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Checkout Earning Note (Logged-In Customer - Optional)</label>
              <input
                type="text"
                value={settings.checkoutEarnMessage || ""}
                placeholder="Complete your order to earn +%s points (%sx tier multiplier)"
                onChange={(e) =>
                  setSettings({ ...settings, checkoutEarnMessage: e.target.value })
                }
              />
              <p className="help-text">
                Optional note in checkout for logged-in members. Use <code>%s</code> for points earned.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: VIP Tier Ladder */}
      {activeTab === "tiers" && (
        <div className="loyalty-table-container">
          <table>
            <thead>
              <tr>
                <th>Tier Name</th>
                <th>Badge Label</th>
                <th>Min Points Milestone</th>
                <th>Points Multiplier</th>
                <th>Free Shipping Perk</th>
                <th>Accent Color</th>
              </tr>
            </thead>
            <tbody>
              {settings.tiers.map((tier, idx) => (
                <tr key={tier.id}>
                  <td>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => handleTierChange(idx, "name", e.target.value)}
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        width: "140px",
                        borderRadius: 0,
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={tier.badge || tier.name}
                      onChange={(e) => handleTierChange(idx, "badge", e.target.value)}
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        textTransform: "uppercase",
                        fontFamily: "monospace",
                        width: "110px",
                        borderRadius: 0,
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={tier.minPoints}
                      onChange={(e) => handleTierChange(idx, "minPoints", Number(e.target.value))}
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        fontFamily: "monospace",
                        width: "90px",
                        borderRadius: 0,
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1.0"
                      step="0.05"
                      value={tier.multiplier}
                      onChange={(e) => handleTierChange(idx, "multiplier", Number(e.target.value))}
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid var(--theme-elevation-200)",
                        background: "var(--theme-input-bg, var(--theme-elevation-50))",
                        color: "var(--theme-text)",
                        fontFamily: "monospace",
                        width: "75px",
                        borderRadius: 0,
                      }}
                    />
                  </td>
                  <td>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(tier.freeShipping)}
                        onChange={(e) => handleTierChange(idx, "freeShipping", e.target.checked)}
                        style={{ accentColor: "#d97706" }}
                      />
                      <span>Free Shipping VIP</span>
                    </label>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="color"
                        value={tier.color || "#b45309"}
                        onChange={(e) => handleTierChange(idx, "color", e.target.value)}
                        style={{ width: "28px", height: "28px", border: "1px solid var(--theme-elevation-200)", padding: 0, cursor: "pointer", borderRadius: 0 }}
                      />
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--theme-elevation-500)", textTransform: "uppercase" }}>
                        {tier.color}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Rewards & Bonuses */}
      {activeTab === "rewards" && (
        <div className="loyalty-cards-grid">
          <div className="loyalty-card">
            <h3 className="loyalty-card-title">
              <Gift size={18} color="#d97706" />
              Welcome / Signup Bonus
            </h3>
            <p className="loyalty-card-desc">
              Automatically awarded to new customers upon creating an account.
            </p>

            <div className="form-group">
              <label>Signup Bonus Points</label>
              <input
                type="number"
                min="0"
                value={settings.welcomeBonus}
                onChange={(e) => setSettings({ ...settings, welcomeBonus: Number(e.target.value) })}
              />
              <p className="help-text">Granted on customer registration to incentivize first purchases.</p>
            </div>
          </div>

          <div className="loyalty-card">
            <h3 className="loyalty-card-title">
              <Award size={18} color="#d97706" />
              Tier Upgrade Celebration Bonus
            </h3>
            <p className="loyalty-card-desc">
              Awarded instantly when a customer crosses a lifetime milestone and levels up to a higher VIP Tier.
            </p>

            <div className="form-group">
              <label>Tier Promotion Bonus Points</label>
              <input
                type="number"
                min="0"
                value={settings.tierUpgradeBonus}
                onChange={(e) => setSettings({ ...settings, tierUpgradeBonus: Number(e.target.value) })}
              />
              <p className="help-text">Surprise & delight perk when ascending the VIP ladder.</p>
            </div>
          </div>
        </div>
      )}
    </Gutter>
  );
};
