"use client";
import React from "react";

export const N8NHelp: React.FC = () => {
  return (
    <div
      style={{
        marginTop: "40px",
        padding: "25px 0 ",
        borderTop: "1px solid var(--theme-elevation-200)",
        borderRadius: "4px"
      }}
    >
      <h4 style={{ marginBottom: "15px", color: "var(--theme-text)" }}>How to set up the Automation For Shipping with Shippo or EasyPost:</h4>

      <ol style={{ paddingLeft: "20px", lineHeight: "1.8", color: "var(--theme-elevation-800)" }}>
        <li>
          <strong>Trigger:</strong> Set a Webhook Node in n8n to receive the order JSON when Amerta status changes.
          <code style={{ display: "block", background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" }}>{`if(order.status === "processing") { //continue to Shippo/Easy Post }`}</code>
        </li>
        <li>
          <strong>Process:</strong> Use Shippo/EasyPost nodes in n8n to generate a label and capture the tracking number.
          <code style={{ display: "block", background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" }}>
            {`//loop through order.items and create shipment from order.items[index].product, you will get {length?: number | null; height?: number | null; weight?: number | null;}, then get tracking number from response`}
          </code>
        </li>
        <li>
          <strong>Finalize:</strong> Use the Payload Node to update the order tracking code:
          <code style={{ display: "block", background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" }}>
            {`Save the tracking number to the order by calling Payload API: /api/orders/`}
            <strong>{`order?.id || ":id"`}</strong>
            <code style={{ background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" }}>PUT</code>
          </code>
          <code style={{ display: "block", background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginTop: "5px", marginLeft: "5px" }}>{`Update shippingTrackingNumber, shippingCarrier and status to shipped in the order fields`}</code>
          Trigger the email notification by sending POST to <code style={{ background: "var(--theme-elevation-200)", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" }}>/:id/send-email</code> with action <strong>send_status_email</strong> to notify the client.
        </li>
      </ol>

      <p style={{ marginTop: "15px", fontSize: "13px", fontStyle: "italic", opacity: 0.7 }}>Tip: Use the "Test Order" relationship above to verify your workflow before going live.</p>
    </div>
  );
};
