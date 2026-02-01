import React from "react";
import { Gutter } from "@payloadcms/ui/elements/Gutter";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { AdminViewServerProps } from "payload";
import { ImportProductsClient } from "./ImportProductsClient";
import { ImportBlogs } from "./ImportsBlogs";

export const ImportView = ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  return (
    // DefaultTemplate wraps your content with the standard Admin Sidebar/Header
    <DefaultTemplate i18n={initPageResult.req.i18n} locale={initPageResult.locale} params={params} payload={initPageResult.req.payload} permissions={initPageResult.permissions} searchParams={searchParams} user={initPageResult.req.user || undefined} visibleEntities={initPageResult.visibleEntities}>
      <Gutter>
        <div style={{ marginTop: "40px" }}>
          <ImportProductsClient />
        </div>
        <div style={{ marginTop: "40px", marginBottom: "40px" }}>
          <ImportBlogs />
        </div>
      </Gutter>
    </DefaultTemplate>
  );
};
