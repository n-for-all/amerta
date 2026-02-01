"use client";

import React, { useState } from "react";
import { useForm, useFormFields } from "@payloadcms/ui";
import styles from "./index.module.scss";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

export const SendTestEmailButton: React.FC = () => {
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { getData } = useForm();

  const smtpEnabled = useFormFields(([fields]) => fields.smtpEnabled?.value as boolean);

  const handleSendTestEmail = async () => {
    const formData = getData();

    if (!testEmail) {
      setMessage({ type: "error", text: "Please enter an email address" });
      return;
    }

    if (!smtpEnabled) {
      setMessage({ type: "error", text: "SMTP is not enabled" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(getAdminApiURL("/send-test-email"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testEmail,

          smtpSettings: formData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Test email sent successfully to ${testEmail}` });
        setTestEmail("");
      } else {
        setMessage({ type: "error", text: result.message || "Failed to send test email" });
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <label htmlFor="testEmail" className={styles.label}>
          Send Test Email
        </label>
        <div className={styles.inputWrapper}>
          <input id="testEmail" type="email" placeholder="Enter email address" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} disabled={loading || !smtpEnabled} className={styles.input} />
          <button type="button" onClick={handleSendTestEmail} disabled={loading || !smtpEnabled} className={styles.button}>
            {loading ? "Sending..." : "Send Test Email"}
          </button>
        </div>
        <p className={styles.description}>Send a test email to verify your SMTP configuration is working correctly, You must save the settings before sending a test email.</p>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}
    </div>
  );
};
