import { Media } from "@/amerta/components/Media";
import { Header } from "@/payload-types";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { getURL } from "@/amerta/utilities/getURL";
import { cn } from "@/amerta/utilities/ui";
import Link from "next/link";
import { Config } from "payload";

export const Logo = async ({ locale, logoClassName }: { locale: string; logoClassName?: string }) => {
  const headerData: Header = await getCachedGlobal("header" as keyof Config["globals"], 1, locale)();
  const logoLight = headerData?.logoLight;
  const logoDark = headerData?.logoDark;

  return (
    <Link href={getURL(`/`, locale)} className={cn("relative block w-full h-8 md:h-10", logoClassName || "")}>
      {logoLight && (
        <div className="block dark:hidden">
          <Media resource={logoLight} fill={true} htmlElement={null} imgClassName="!relative" />
        </div>
      )}
      {logoDark && (
        <div className="hidden dark:block">
          <Media resource={logoDark} fill={true} htmlElement={null} imgClassName="!relative" />
        </div>
      )}
      {/* Fallback if only one logo is provided */}
      {!logoDark && logoLight && (
        <div className="hidden dark:block">
          <Media resource={logoLight} fill={true} htmlElement={null} imgClassName="!relative" />
        </div>
      )}
      {!logoLight && logoDark && (
        <div className="block dark:hidden">
          <Media resource={logoDark} fill={true} htmlElement={null} imgClassName="!relative" />
        </div>
      )}
    </Link>
  );
};
