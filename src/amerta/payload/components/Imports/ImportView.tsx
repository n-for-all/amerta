import React from "react";
import { Gutter } from "@payloadcms/ui/elements/Gutter";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { AdminViewServerProps } from "payload";
import { ImportTabs } from "./ImportTabs"; // Import the new client component

export const ImportView = ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  return (
    <DefaultTemplate i18n={initPageResult.req.i18n} locale={initPageResult.locale} params={params} payload={initPageResult.req.payload} permissions={initPageResult.permissions} searchParams={searchParams} user={initPageResult.req.user || undefined} visibleEntities={initPageResult.visibleEntities}>
      <Gutter>
        <ImportTabs />
      </Gutter>
    </DefaultTemplate>
  );
};
