import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import type { Settings } from "@/payload-types";

export const Icon = async () => {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  if (settings?.favicon && typeof settings.favicon === "object" && settings.favicon.url) {
    return (
      <div className="logo">
        <img src={settings.favicon.url} height={18}/>
      </div>
    );
  }

  return (
    <div className="logo">
      <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" height={18} style={{maxHeight: '100%', maxWidth: '100%'}}>
        <path d="M11.068 0 22.08 6.625v12.573L13.787 24V11.427L2.769 4.808 11.068 0ZM1.92 18.302l8.31 -4.812v9.812l-8.31 -5Z" fill="#000000" strokeWidth={1} />
      </svg>
    </div>
  );
};
