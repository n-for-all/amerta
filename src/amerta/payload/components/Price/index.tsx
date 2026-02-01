"use client";

import { NumberField, usePayloadAPI } from "@payloadcms/ui";

import "./index.css";
import { useState } from "react";
import { Currency, SalesChannel } from "@/payload-types";

const Price = (props) => {
  const { label, required = false } = props.field;
  const [{ data, isError, isLoading }] = usePayloadAPI("/api/sales-channel?where[isDefault][equals]=true&where[isEnabled][equals]=1&limit=1&depth=2");
  const [value, setValue] = useState(props.field.value || "");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading sales channel.</div>;
  }

  if (!data || !data.docs || data.docs.length === 0) {
    return <div>No default sales channel found.</div>;
  }

  const salesChannel: SalesChannel = data.docs[0];

  // Get default currency from the sales channel
  const defaultCurrency = salesChannel.currencies?.find((curr) => curr.isDefault);

  if (!defaultCurrency || !defaultCurrency.currency) {
    return <div>Default currency is not set in the sales channel.</div>;
  }

  const currency: Currency | null = typeof defaultCurrency.currency === "string" ? null : defaultCurrency.currency;
  if (!currency) {
    return <div>Currency data not available.</div>;
  }

  return (
    <div className="field-type text" style={{ flex: "1 1 auto" }}>
      {label ? (
        <span className="field-label">
          {label}
          {required ? <span className="required">*</span> : ""}
        </span>
      ) : null}
      <div className="field-price__with-currency">
        <span>{(currency as Currency)?.symbol}</span>
        <NumberField
          {...props}
          field={{
            ...props.field,
            label: false,
          }}
          value={value}
          onChange={(value) => {
            setValue(value);
          }}
        />
      </div>
    </div>
  );
};

export default Price;
