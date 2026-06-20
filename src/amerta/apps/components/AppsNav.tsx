"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavGroup, useTranslation } from "@payloadcms/ui";
import { getTranslation } from "@payloadcms/translations";
import { getAdminURL } from "@/amerta/utilities/getAdminURL";

const baseClass = "nav";

export const AppsNav = ({ navPreferences, appsToRender }) => {
  const pathname = usePathname();
  const { i18n } = useTranslation();

  return (
    <>
      <NavGroup isOpen={navPreferences?.groups?.["Apps"]?.open} label={getTranslation("Apps", i18n)}>
        {/* Always render the Settings link */}
        <Link className={`${baseClass}__link`} href={getAdminURL("/globals/apps")} id="nav-apps-settings" prefetch={false}>
          {pathname.endsWith("/globals/apps") && <div className={`${baseClass}__link-indicator`} />}
          <span className={`${baseClass}__link-label`}>{getTranslation("Settings", i18n)}</span>
        </Link>
        
        {/* Render active apps */}
        {appsToRender.map((app) => {
          const href = app.adminNavigation?.path || "";
          const id = `nav-app-${app.slug}`;
          const isActive = pathname.endsWith(href);

          return (
            <Link className={`${baseClass}__link`} href={href} id={id} key={app.slug} prefetch={false}>
              {isActive && <div className={`${baseClass}__link-indicator`} />}
              <span className={`${baseClass}__link-label`}>{getTranslation(app.adminNavigation?.label, i18n)}</span>
            </Link>
          );
        })}
      </NavGroup>
    </>
  );
};
