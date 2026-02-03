"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGroup } from "@payloadcms/ui";
import { useTranslation } from "@payloadcms/ui";
import { getTranslation } from "@payloadcms/translations";
import { getAdminURL } from "@/amerta/utilities/getAdminURL";

const baseClass = "nav";
const entities = [
  {
    slug: "import-sample-data",
    type: "import-sample-data",
    label: "Sample Data",
  },
  {
    slug: "import-wp",
    type: "import-wp",
    label: "WooCommerce",
  },
  {
    slug: "import-shopify",
    type: "import-shopify",
    label: "Shopify",
  },
];
export const ImportsNav = ({ navPreferences, label }) => {
  const pathname = usePathname();
  const { i18n } = useTranslation();
  return (
    <>
      <NavGroup isOpen={navPreferences?.groups?.[label]?.open} label={getTranslation("Imports", i18n)}>
        {entities.map(({ slug, label }, i) => {
          const href: string = "/" + slug;
          const id = `nav-import-wp-${slug}`;

          const isActive = pathname.endsWith(href);
          const Label = (
            <>
              {isActive && <div className={`${baseClass}__link-indicator`} />}
              <span className={`${baseClass}__link-label`}>{getTranslation(label, i18n)}</span>
            </>
          );

          return (
            <Link className={`${baseClass}__link`} href={getAdminURL(href)} id={id} key={i} prefetch={false}>
              {Label}
            </Link>
          );
        })}
      </NavGroup>
    </>
  );
};
