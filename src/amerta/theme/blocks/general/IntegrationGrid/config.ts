import type { Block } from "payload";

import { integrationFields } from "../../shared/integrationFields";

export const ThemeShopIntegrationGridBlock: Block = {
  slug: "themeShopIntegrationGrid",
  dbName: "theme_int_grid",
  interfaceName: "ThemeShopIntegrationGridBlock",
  fields: [...integrationFields],
  labels: {
    plural: "Theme Shop Integration Grids",
    singular: "Theme Shop Integration Grid",
  },
};
