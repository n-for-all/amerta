import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import type { Header as HeaderProps } from "@/payload-types";

export const Logo = async () => {
  const headerData: HeaderProps = await getCachedGlobal("header" as keyof Config["globals"], 1)();
  if (headerData?.logoLight && typeof headerData.logoLight === "object" && headerData.logoLight.url) {
    return (
      <div className="logo">
        <img style={{ height: "50px", maxHeight: "100%", maxWidth: "100%" }} src={headerData.logoLight.url} />
      </div>
    );
  }

  return (
    <div className="logo">
      <svg role="img" height="80px" viewBox="0 0 88 88" style={{ maxHeight: "100%", maxWidth: "100%" }} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
          <g transform="translate(0.000000, 11.500000)">
            <path d="M30.894938,47.0088898 L47.3878326,0.021484375 L64.8004761,0.021484375 L87.7811279,65.5 L72.7944031,65.5 L62.5036469,33.630722 C61.2319794,29.4568329 59.9333038,25.1468735 58.6076202,20.7008438 C57.2819366,16.2548141 55.8418121,11.2124329 54.2872467,5.57369995 L57.9958191,5.57369995 C56.409668,11.2124329 54.9458542,16.2548141 53.6043777,20.7008438 C52.2629013,25.1468735 50.93367,29.4568329 49.616684,33.630722 L39.0018311,65.5 L30.894938,47.0088898 Z M38.9970245,51.2363129 L38.9970245,40.4079132 L73.2125702,40.4079132 L73.2125702,51.2363129 L38.9970245,51.2363129 Z" id="A" fill="#000000" fillRule="nonzero" />
            <polygon fill="#0891B2" points="39 0 24.5 2.89742189e-14 6.44817189 47.5274358 13.5 65.5 28.5 65.5 21 47.5" />
            <circle fill="#000000" cx={10} cy="46.5" r={10} />
          </g>
        </g>
      </svg>
    </div>
  );
};
