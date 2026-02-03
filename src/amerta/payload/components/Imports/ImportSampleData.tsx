import { Gutter } from "@payloadcms/ui/elements/Gutter";
import { DefaultTemplate } from "@payloadcms/next/templates";
import { AdminViewServerProps } from "payload";
import { ImportSampleDataTabs } from "./ImportSampleDataTabs";

export const ImportSampleData = ({ initPageResult, params, searchParams }: AdminViewServerProps) => {
  return (
    <DefaultTemplate i18n={initPageResult.req.i18n} locale={initPageResult.locale} params={params} payload={initPageResult.req.payload} permissions={initPageResult.permissions} searchParams={searchParams} user={initPageResult.req.user || undefined} visibleEntities={initPageResult.visibleEntities}>
      <Gutter>
        <div style={{ marginTop: "40px", maxWidth: "800px" }}>
          <h1 style={{ marginBottom: "20px" }}>Sample Data</h1>
          <ImportSampleDataTabs />
        </div>
      </Gutter>
    </DefaultTemplate>
  );
};
