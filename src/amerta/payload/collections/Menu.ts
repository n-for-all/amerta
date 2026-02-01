import type { CollectionConfig } from "payload";

import { link } from "../fields/link/link";
import { slugField } from "@/amerta/fields/slug";
import { Menu as MenuType } from "@/payload-types";
import { revalidateTag } from "next/cache";

const populateNavItems = async ({ doc, req }: { doc: MenuType; req?: any }) => {
  if (doc.navItems && doc.navItems.length > 0) {
    const populatedNavItems = await Promise.all(
      doc.navItems.map(async (navItem) => {
        if (navItem.link) {
          const relationTo = navItem.link?.reference?.relationTo;
          const value = navItem.link?.reference?.value;
          // Only populate if it's a relationship and has a value (ID)
          if (relationTo && value) {
            try {
              // Use Payload's findByID operation to fetch the linked document
              const populatedDoc = await req.payload.findByID({
                collection: relationTo,
                id: value,
                // You can limit the fields fetched if needed
                // select: ['slug']
              });

              if (!populatedDoc) return null;

              // Return the navItem with the 'value' replaced by the full populated document
              return {
                ...navItem,
                link: {
                  ...navItem.link,
                  reference: {
                    relationTo: navItem.link.reference?.relationTo,
                    value: populatedDoc,
                  },
                },
              };
            } catch (error) {
              // Handle case where linked doc might be missing
              console.error(`Error populating ${relationTo} with ID ${value}:`, error);
              return null;
            }
          }

          return navItem;
        }
        return null;
      }),
    );
    doc.navItems = populatedNavItems.filter((v) => v !== null) as any;
  }
  return doc;
};

export const Menu: CollectionConfig = {
  slug: "menu",
  labels: {
    plural: "Menu",
    singular: "Menu",
  },
  admin: {
    group: "Content",
    useAsTitle: "title",
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterRead: [populateNavItems],
    afterChange: [
      () => {
        revalidateTag("globals", "max");
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
    },
    ...slugField(),
    {
      name: "publishedOn",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === "published" && !value) {
              return new Date();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "navItems",
      type: "array",
      label: "Navigation Items",
      localized: true,
      maxRows: 6,
      admin: {
        description: "Use {locale} in custom URLs to have them adapt based on the current locale",
        components: {
          RowLabel: "@/amerta/fields/link/RowLabel#RowLabel",
        },
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
};
