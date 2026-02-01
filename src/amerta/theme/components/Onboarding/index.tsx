"use client";
import React, { useState } from "react";
import { Button } from "@payloadcms/ui/elements/Button";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

type Step = "import" | "finish";

export const Onboarding = ({ onSuccess }: { onSuccess: () => void }) => {
  const [step, setStep] = useState<Step>("import");
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Data for Dropdown
  const [currencies, setCurrencies] = useState<{ label: string; value: string }[]>([]);

  // 🔴 FIX 1: Start with empty string. No assumption of "USD".
  const [selectedCurrency, setSelectedCurrency] = useState("");

  // --- STEP 1: IMPORT DATA ---
  const handleImport = async () => {
    setLoading(true);
    setLogs(["Importing Countries & Currencies..."]);

    try {
      const res = await fetch(getAdminApiURL("/setup/import"), { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setLogs((p) => [...p, ...data.logs, "Import successful."]);

        const currRes = await fetch(getAdminApiURL("/setup/currencies"));
        const currData = await currRes.json();

        setCurrencies(
          currData.docs.map((c: any) => ({
            label: `${c.name} (${c.code})`,
            value: c.code,
          })),
        );

        setLoading(false);
        setStep("finish");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setLogs((p) => [...p, "Error: " + e.message]);
      setLoading(false);
    }
  };

  // --- STEP 2: CREATE STORE ---
  const handleFinish = async () => {
    if (!selectedCurrency) return; // Double check safety

    setLoading(true);
    setLogs((p) => [...p, `Creating store with currency: ${selectedCurrency}...`]);

    try {
      const res = await fetch(getAdminApiURL("/setup/store"), {
        method: "POST",
        body: JSON.stringify({ currency: selectedCurrency }),
      });
      const data = await res.json();

      if (data.success) {
        setLogs((p) => [...p, "Store created!", "Reloading..."]);
        setTimeout(() => onSuccess(), 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setLogs((p) => [...p, "Error: " + e.message]);
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#111", color: "white" }}>
      <div style={{ width: "550px", padding: "40px", background: "#222", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h1 style={{ marginBottom: "10px" }}>Setup Wizard</h1>
        <p style={{ marginBottom: "20px", color: "#888" }}>{step === "import" ? "Step 1: Import Base Data" : "Step 2: Configure Store"}</p>

        {/* LOGS */}
        <div style={{ background: "#000", padding: "10px", height: "150px", overflowY: "auto", fontFamily: "monospace", fontSize: "12px", marginBottom: "20px", borderRadius: "4px", color: "#ccc" }}>
          {logs.map((l, i) => (
            <div key={i} style={{ marginBottom: "4px" }}>
              &gt; {l}
            </div>
          ))}
          {loading && (
            <div className="animate-pulse" style={{ color: "#fff" }}>
              &gt; Processing...
            </div>
          )}
        </div>

        {/* --- ACTIONS --- */}
        {step === "import" ? (
          <Button onClick={handleImport} disabled={loading} size="large">
            Import Data
          </Button>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2">
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>Select Default Currency</label>

            <select style={{ width: "100%", padding: "12px", marginBottom: "20px", background: "#333", color: "white", border: "1px solid #444", borderRadius: "4px" }} value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
              {/* 🔴 FIX 2: Placeholder option forces interaction */}
              <option value="" disabled>
                -- Select a currency --
              </option>
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* 🔴 FIX 3: Disable button if no currency is selected */}
            <Button onClick={handleFinish} disabled={loading || !selectedCurrency} size="large">
              Create Store & Finish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
