import { AUTH_PROVIDERS } from "@/amerta/auth";
import { camelSlug } from "@/amerta/utilities/camelSlug";
import { Field, Tab } from "payload";

export const AuthenticationFields: Field[] = [
  {
    type: "tabs",
    tabs: [
      ...(AUTH_PROVIDERS.map((adapter) => {
        const groupKey = `${camelSlug(adapter.slug)}Settings`; // e.g. "googleSettings", "webauthnSettings"

        return {
          label: adapter.label,
          fields: [
            {
              name: groupKey,
              label: ``,
              type: "group",
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  label: `Enable ${adapter.label}`,
                  defaultValue: false,
                } as Field,
                ...adapter.settingsFields.map((field: Field): Field => {
                  return {
                    ...field,
                    admin: {
                      ...field.admin,
                      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
                    },
                  } as Field;
                }),
              ],
            },
          ],
        };
      }) as Tab[]),
    ],
  },
];
