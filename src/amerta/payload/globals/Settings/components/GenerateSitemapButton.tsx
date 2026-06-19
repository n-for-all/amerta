"use client";

import React, { useState } from "react";
import { Button, useToast } from "@payloadcms/ui";

export const GenerateSitemapButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsLoading(true);
    toast({
      message: "Generating sitemaps... This may take a moment.",
      type: "info",
    });

    try {
      const res = await fetch(`/api/admin/settings/generate-sitemaps`, {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast({
          message: "Sitemaps generated successfully!",
          type: "success",
        });
      } else {
        throw new Error(data.error || "Failed to generate sitemaps");
      }
    } catch (err: any) {
      toast({
        message: err.message || "An error occurred",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="field-type" style={{ marginBottom: "20px" }}>
      <div style={{ marginBottom: "10px" }}>
        <strong>XML Sitemap Generation</strong>
        <p style={{ color: "#666", fontSize: "13px", marginTop: "4px" }}>
          Manually trigger the generation of XML sitemaps using next-sitemap. This will run in the background.
        </p>
      </div>
      <Button 
        onClick={handleGenerate} 
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : "Generate Sitemaps"}
      </Button>
    </div>
  );
};
