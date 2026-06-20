"use client";

import React, { useState, useEffect } from "react";
import { Gutter, toast, Button, TextInput, TextareaInput, SelectInput } from "@payloadcms/ui";
import './index.scss';

export const SettingsClient = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [merchantId, setMerchantId] = useState("");
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [dataSourceId, setDataSourceId] = useState("");
  const [salesChannelId, setSalesChannelId] = useState("");
  const [targetCountryId, setTargetCountryId] = useState("");
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [availableCountries, setAvailableCountries] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [developerEmail, setDeveloperEmail] = useState("");
  const [registerMerchantId, setRegisterMerchantId] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch initial data from the Apps global
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const res = await fetch("/api/globals/apps");
        if (res.ok) {
          const data = await res.json();
          const googleSettings = data.appSettings?.["google-merchant"];
          if (googleSettings) {
            setMerchantId(googleSettings.merchantId || "");
            setServiceAccountJson(googleSettings.serviceAccountJson || "");
            setDataSourceId(googleSettings.dataSourceId || "");
            setSalesChannelId(googleSettings.salesChannelId || "");
            setTargetCountryId(googleSettings.targetCountryId || "");
            
            // If they already have credentials, they can start at step 2 or 3
            if (googleSettings.merchantId && googleSettings.serviceAccountJson) {
              if (googleSettings.dataSourceId) {
                setCurrentStep(3);
              } else {
                setCurrentStep(2);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch Apps global", err);
      } finally {
        setIsInitializing(false);
      }
    };
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/sales-channel?limit=100");
        if (res.ok) {
          const data = await res.json();
          setAvailableChannels(data.docs.map((sc: any) => ({ label: sc.name, value: sc.id })));
        }
      } catch (err) {
        console.error("Failed to fetch sales channels", err);
      }
    }
    const fetchCountries = async () => {
      try {
        const res = await fetch("/api/country?where[active][equals]=1&limit=100");
        if (res.ok) {
          const data = await res.json();
          setAvailableCountries(data.docs.map((c: any) => ({ label: c.display_name || c.name, value: c.id })));
        }
      } catch (err) {
        console.error("Failed to fetch countries", err);
      }
    };
    fetchChannels();
    fetchCountries();
    fetchGlobal();
  }, []);

  const handleSave = async (showToast = true, overrideData: any = {}) => {
    setSaving(true);
    try {
      const res = await fetch("/api/globals/apps");
      const currentGlobal = await res.json();
      const currentSettings = currentGlobal.appSettings || {};
 
      const newSettings = {
        ...currentSettings,
        "google-merchant": {
          merchantId,
          serviceAccountJson,
          dataSourceId,
          salesChannelId,
          targetCountryId,
          ...overrideData,
        },
      };

      const saveRes = await fetch("/api/globals/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appSettings: newSettings,
        }),
      });

      if (!saveRes.ok) throw new Error("Failed to save settings");
      
      if (showToast) toast.success("Settings saved successfully.");
      return true;
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateStep1 = async () => {
    setErrorMsg(null);
    if (!merchantId) {
      toast.error("Merchant ID is required.");
      return;
    }
    if (!serviceAccountJson) {
      toast.error("Service Account JSON is required.");
      return;
    }
    try {
      JSON.parse(serviceAccountJson);
    } catch (e) {
      toast.error("Invalid Service Account JSON format.");
      return;
    }
    
    // Save before moving to next step so backend can use credentials
    const saved = await handleSave(false);
    if (saved) setCurrentStep(2);
  };

  const validateStep2 = async () => {
    setErrorMsg(null);
    if (!dataSourceId) {
      toast.error("Data Source ID is required.");
      return;
    }
    const saved = await handleSave(false);
    if (saved) setCurrentStep(3);
  };

  const fetchSources = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/google-merchant/sources");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch sources");
      }
      
      const data = await res.json();
      if (data.sources && data.sources.length > 0) {
        setSources(data.sources);
        toast.success(`Found ${data.sources.length} data sources`);
      } else {
        toast.info("No data sources found.");
        setSources([]);
      }
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const registerDeveloper = async () => {
    if (!developerEmail) {
      toast.error("Please enter a Developer Email.");
      return;
    }
    setRegistering(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/google-merchant/register", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developerEmail, merchantId: registerMerchantId || merchantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register developer");
      toast.success("Successfully registered Developer API!");
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setRegistering(false);
    }
  };

  const grantAccess = async () => {
    if (!developerEmail) {
      toast.error("Please enter a Developer Email.");
      return;
    }
    setRegistering(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/google-merchant/grant-access", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developerEmail, merchantId: registerMerchantId || merchantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to grant access");
      toast.success("Successfully granted API_DEVELOPER access!");
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setRegistering(false);
    }
  };

  const syncProducts = async () => {
    setSyncing(true);
    setErrorMsg(null);
    toast.info("Starting sync process...");
    try {
      const res = await fetch("/api/google-merchant/sync", {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }
      toast.success(`Sync successful! Sent ${data.count || 0} products.`);
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      toast.error(`Sync Error: ${msg}`);
      setErrorMsg(msg);
    } finally {
      setSyncing(false);
    }
  };

  const clearProducts = async () => {
    setClearing(true);
    setErrorMsg(null);
    toast.info("Clearing products from Merchant Center...");
    try {
      const res = await fetch("/api/google-merchant/clear", {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Clear failed");
      }
      toast.success(`Clear successful! Deleted ${data.count || 0} products.`);
    } catch (err: any) {
      const msg = err.message || "An error occurred";
      toast.error(msg);
      setErrorMsg(msg);
    } finally {
      setClearing(false);
    }
  };

  if (isInitializing) {
    return <Gutter className="gm-settings"><p>Loading...</p></Gutter>;
  }

  return (
    <Gutter className="gm-settings">
      <div>
        <h1 className="gm-settings__title">Google Merchant Integration</h1>
        <p className="gm-settings__subtitle">Follow the steps below to configure your product syndication.</p>

        {/* Stepper Indicator */}
        <div className="gm-settings__stepper">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`gm-settings__step ${currentStep === step ? 'gm-settings__step--active' : currentStep > step ? 'gm-settings__step--completed' : ''}`}
              >
                {currentStep > step ? "✓" : step}
              </div>
              {step < 3 && (
                <div className={`gm-settings__step-line ${currentStep > step ? 'gm-settings__step-line--completed' : ''}`}></div>
              )}
            </React.Fragment>
          ))}
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid #dc2626', color: '#dc2626', padding: '16px', borderRadius: '4px', marginBottom: '24px', userSelect: 'text' }}>
            <strong>Error:</strong>
            <p style={{ marginTop: '8px', wordBreak: 'break-word', lineHeight: '1.5' }}>{errorMsg}</p>
          </div>
        )}

        {/* Step 1: Credentials */}
        {currentStep === 1 && (
          <div className="gm-settings__panel">
            <h2>Step 1: Credentials</h2>
            <p>Provide your Google Merchant ID and the Service Account JSON key to authenticate API requests.</p>
            
            <div className="gm-settings__field">
              <label>Merchant ID</label>
              <TextInput
                path="merchantId"
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="e.g. 123456789"
              />
            </div>

            <div className="gm-settings__field">
              <label>Service Account JSON</label>
              
              <details style={{ fontSize: '13px', color: 'var(--theme-elevation-500)', marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 500, color: 'var(--theme-elevation-800)' }}>How to generate and connect a Service Account?</summary>
                <ol style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.6' }}>
                  <li>Go to the <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>Google Cloud Console</a> and create a new project.</li>
                  <li>In your project, go to <strong>APIs &amp; Services &gt; Library</strong>, search for <strong>Merchant API</strong> (or Content API for Shopping), and click <strong>Enable</strong>.</li>
                  <li>Create a new Service Account in your GCP project and give it a recognizable name.</li>
                  <li>Open the Service Account, go to the <strong>Keys</strong> tab, and click <strong>Add Key &gt; Create new key</strong> (JSON).</li>
                  <li>Open the downloaded JSON file and paste its entire contents into the field below.</li>
                  <li>Finally, copy the Service Account's <strong>email address</strong>, go to your <a href="https://merchants.google.com/" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>Google Merchant Center</a> &gt; <strong>Settings &gt; People &amp; access</strong>, and add that email address with <strong>Admin</strong> access.</li>
                </ol>
              </details>

              <TextareaInput
                path="serviceAccountJson"
                value={serviceAccountJson}
                rows={10}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                style={{ minHeight: '200px', fontFamily: 'monospace' }}
                placeholder='{ "type": "service_account", "project_id": "..." }'
              />
            </div>

            <div className="gm-settings__actions">
              <Button onClick={validateStep1} disabled={saving} buttonStyle="primary">
                {saving ? "Validating & Saving..." : "Next Step"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Data Source Configuration */}
        {currentStep === 2 && (
          <div className="gm-settings__panel">
            <h2>Step 2: Data Source</h2>
            <p>Fetch your available data sources from Google Merchant or enter the ID manually.</p>
            
            <div className="gm-settings__field" style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid var(--theme-elevation-150)' }}>
              <label>1. Register Developer Email</label>
              <div className="gm-settings__input-row" style={{ marginBottom: '8px' }}>
                <div>
                  <TextInput
                    path="developerEmail"
                    value={developerEmail}
                    onChange={(e) => setDeveloperEmail(e.target.value)}
                    placeholder="Enter your real Google Account Email"
                  />
                </div>
              </div>
              <div className="gm-settings__input-row">
                <div>
                  <TextInput
                    path="registerMerchantId"
                    value={registerMerchantId || merchantId}
                    onChange={(e) => setRegisterMerchantId(e.target.value)}
                    placeholder="Merchant ID (Defaults to Step 1)"
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button onClick={registerDeveloper as any} disabled={registering} buttonStyle="secondary">
                    {registering ? "Processing..." : "Register API"}
                  </Button>
                  <Button onClick={grantAccess as any} disabled={registering} buttonStyle="secondary">
                    {registering ? "Processing..." : "Grant Access"}
                  </Button>
                </div>
              </div>
              <p className="field-note">Required once per Google Cloud Project before fetching sources.</p>
            </div>

            <div className="gm-settings__field">
              <label>2. Fetch Data Source ID</label>
              <div className="gm-settings__input-row">
                <div>
                  {sources.length > 0 ? (
                    <SelectInput
                      path="dataSourceId"
                      name="dataSourceId"
                      options={sources.map(s => ({ label: `${s.displayName} (${s.dataSourceId})`, value: s.dataSourceId }))}
                      value={dataSourceId}
                      onChange={(selected: any) => setDataSourceId(selected ? selected.value : "")}
                    />
                  ) : (
                    <TextInput
                      path="dataSourceId"
                      value={dataSourceId}
                      onChange={(e) => setDataSourceId(e.target.value)}
                      placeholder="Enter Data Source ID manually or click Fetch"
                    />
                  )}
                </div>
                <Button onClick={fetchSources as any} disabled={loading} buttonStyle="secondary">
                  {loading ? "Fetching..." : "Fetch Sources"}
                </Button>
              </div>
            </div>

            <div className="gm-settings__actions gm-settings__actions--between">
              <Button onClick={() => setCurrentStep(1)} buttonStyle="secondary">Back</Button>
              <Button onClick={validateStep2} disabled={saving} buttonStyle="primary">
                {saving ? "Saving..." : "Next Step"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Sync Products */}
        {currentStep === 3 && (
          <div className="gm-settings__panel">
            <div className="gm-settings__center-text">
              <div className="gm-settings__success-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2>Ready to Sync</h2>
              <p>Your credentials and data source are properly configured.</p>
            </div>
            
            <div className="gm-settings__field" style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid var(--theme-elevation-150)', marginTop: '24px' }}>
              <label>Select Sales Channel</label>
              <SelectInput
                path="salesChannelId"
                name="salesChannelId"
                options={availableChannels}
                value={salesChannelId}
                onChange={(selected: any) => {
                  const newSalesChannelId = selected ? selected.value : "";
                  setSalesChannelId(newSalesChannelId);
                  setTimeout(() => handleSave(false, { salesChannelId: newSalesChannelId }), 100);
                }}
              />
              <p className="field-note">Products associated with this Sales Channel will be pushed to Google Merchant.</p>
            </div>

            <div className="gm-settings__field" style={{ paddingBottom: '24px', marginBottom: '24px', borderBottom: '1px solid var(--theme-elevation-150)' }}>
              <label>Select Target Country (Feed Label)</label>
              <SelectInput
                path="targetCountryId"
                name="targetCountryId"
                options={availableCountries}
                value={targetCountryId}
                onChange={(selected: any) => {
                  const newTargetCountryId = selected ? selected.value : "";
                  setTargetCountryId(newTargetCountryId);
                  setTimeout(() => handleSave(false, { targetCountryId: newTargetCountryId }), 100);
                }}
              />
              <p className="field-note">The target country (feed label) where the products will be sold (e.g., US, AE).</p>
            </div>

            <div className="gm-settings__actions gm-settings__actions--center" style={{ gap: '12px' }}>
              <Button onClick={() => setCurrentStep(2)} buttonStyle="secondary">Back</Button>
              <Button onClick={clearProducts as any} disabled={clearing || syncing || !dataSourceId} buttonStyle="secondary">
                {clearing ? "Clearing..." : "Clear Merchant Center"}
              </Button>
              <Button onClick={syncProducts as any} disabled={syncing || clearing || !salesChannelId || !targetCountryId} buttonStyle="primary">
                {syncing ? "Syncing to Google..." : "Start Full Sync"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Gutter>
  );
};
