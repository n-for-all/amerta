import { DefaultTemplate } from "@payloadcms/next/templates";
import { AdminViewServerProps } from "payload";
import { redirectUnlessAdmin } from "@/amerta/apps/components/redirectUnlessAdmin";
import { SettingsClient } from "./SettingsClient";

export const SettingsView = ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  redirectUnlessAdmin(initPageResult, params);
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <SettingsClient />
    </DefaultTemplate>
  );
};
