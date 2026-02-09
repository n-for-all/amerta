"use client";

import React, { useState, useMemo } from "react";
import { useForm, Button, useDocumentInfo, useConfig, useModal, Modal, toast } from "@payloadcms/ui";

const modalSlug = "unsaved-order-warning";

export const OrderActions: React.FC = () => {
  const { id } = useDocumentInfo();
  const { config } = useConfig();
  const { fields } = useForm();
  const { toggleModal } = useModal();

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isModified = useMemo(() => {
    if (!fields) return false;
    return Object.values(fields).some((field) => {
      if (!field || typeof field !== "object") return false;
      return field.value !== field.initialValue;
    });
  }, [fields]);

  const serverURL = config.serverURL || "";
  const apiRoute = `${serverURL}/api/orders/${id}/send-email`;

  const handleAction = async (actionValue: string, label: string) => {
    if (isModified) {
      setIsOpen(false);
      toggleModal(modalSlug);
      return;
    }

    if (!id) {
      toast.error("Please create and save the order first.");
      return;
    }

    setIsProcessing(true);
    setIsOpen(false);

    const toastId = toast.loading(`Sending: ${label}...`);

    try {
      const res = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: actionValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      toast.success(`Email Sent: ${label}`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error sending email", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="order-actions-dropdown" style={{ position: "relative", display: "flex", alignItems: "center" }}>
      <button
        type="button"
        className={`btn btn--icon-style-without-border btn--size-medium btn--withoutPopup btn--style-primary ${isProcessing ? "btn--disabled" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        disabled={isProcessing}
        style={{ marginRight: "8px", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <span className="btn__content">
          {isProcessing ? "Sending..." : "Email Actions"}{" "}
          <svg className="icon icon--chevron" height="100%" viewBox="0 0 20 20" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path className="stroke" d="M14 8L10 12L6 8" strokeLinecap="square" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />

          <div
            style={{
              position: "absolute",
              top: "calc(100% + 5px)",
              right: 0,
              backgroundColor: "var(--theme-elevation-100)",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: "4px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              width: "240px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <MenuOption label="Send Status Notification" desc="Sends email to customer for CURRENT saved status" onClick={() => handleAction("send_status_email", "Status Email")} />
            <MenuOption label="Resend Receipt" desc="Resend 'New Order' confirmation to customer" onClick={() => handleAction("resend_receipt", "Receipt")} />
            <MenuOption label="Resend Order Details/Invoice" desc="Resend Order Details/Invoice to customer" onClick={() => handleAction("resend_invoice", "Invoice")} />
          </div>
        </>
      )}

      <Modal slug={modalSlug} className="modal-dialog" style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "40px", maxWidth: "500px", backgroundColor: "var(--theme-elevation-100)", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}>
          <h2 style={{ marginBottom: "20px" }}>Unsaved Changes</h2>
          <p style={{ marginBottom: "30px", lineHeight: "1.6" }}>
            You have unsaved changes. <br />
            Please <strong>Save</strong> the order first so we don't send outdated information to the customer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Button buttonStyle="secondary" onClick={() => toggleModal(modalSlug)}>
              Cancel
            </Button>
            <Button
              buttonStyle="primary"
              onClick={() => {
                toggleModal(modalSlug);
              }}
            >
              OK, I will Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const MenuOption = ({ label, desc, onClick }: any) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    style={{
      textAlign: "left",
      background: "none",
      border: "none",
      padding: "10px 12px",
      cursor: "pointer",
      width: "100%",
      borderBottom: "1px solid var(--theme-elevation-150)",
      display: "flex",
      flexDirection: "column",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--theme-elevation-150)")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <span style={{ fontWeight: 600, fontSize: "1rem" }}>{label}</span>
    <span style={{ fontSize: "0.9rem", opacity: 0.7, whiteSpace: "normal", display: "block", lineHeight: 1.2 }}>{desc}</span>
  </button>
);
