import { Settings } from "@/payload-types";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import React from "react";

const BeforeLogin: React.FC = async () => {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  return (
    <h3 style={{ marginBottom: "1rem" }}>
      {"Welcome to "}
      {settings?.siteTitle}!
    </h3>
  );
};

export default BeforeLogin;
