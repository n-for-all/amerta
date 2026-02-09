"use client";
import { useField } from "@payloadcms/ui";
import React, { useEffect, useState } from "react";
import { EmailTemplate } from "./EmailTemplate";
import { getDefaultEmailTemplateSettings } from "@/amerta/utilities/emails/getDefaultEmailTemplateSettings";

type Props = {
  path: string;
  label: string;
};

export const EmailBuilder: React.FC<Props> = ({ path, label }) => {
  const { value, setValue } = useField<any>({ path });
  // State to hold server settings
  const [serverSettings, setServerSettings] = useState<any>(null);

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getDefaultEmailTemplateSettings();
        setServerSettings(data);
      } catch (error) {
        console.error("Failed to load template settings", error);
      }
    };
    loadSettings();
  }, []);
  return (
    <div className="field-type email-builder" style={{ marginBottom: "20px" }}>
      <label className="field-label" style={{ marginBottom: "10px", display: "block", fontWeight: "bold" }}>
        {label}
      </label>
      <textarea name={path} style={{ display: "none" }} value={value || ""} readOnly />
      <EmailTemplate value={value || ""} onValueChange={setValue} loading={false} settings={serverSettings} />
    </div>
  );
};
