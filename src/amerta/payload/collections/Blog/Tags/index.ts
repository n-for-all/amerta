/**
 * @module Collections/Blog/Tags
 * @title Blog Tags Collection
 * @description This module defines the collections related to the blog tag functionality in Amerta, including posts, categories, and tags. Each collection is structured to support a robust blogging system with features like categorization and tagging for better content organization and discoverability.
 */
import type { CollectionConfig } from "payload";
import { slugField } from "@/amerta/fields/slug";
import { admins } from "@/amerta/access/admins";
import { revalidateTag } from "./hooks/revalidateTag";
import { adminsOrPublished } from "@/amerta/access/adminsOrPublished";
import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

const Tags: CollectionConfig = {
  slug: "tags",
  trash: true,
  admin: {
    group: "Blog",
    useAsTitle: "title",
    defaultColumns: ["title", "_status"],
    preview: (doc, {locale}) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(getURL(`/blog/tags/${doc.slug}`, locale))}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
  },
  versions: {
    drafts: true,
    maxPerDoc: 5,
  },
  hooks: {
    afterChange: [revalidateTag],
  },
  access: {
    read: adminsOrPublished,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "richText",
      required: false,
      localized: true,
    },
    {
      name: "publishedOn",
      type: "date",
      admin: {
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
    ...slugField(),
    {
      name: "meta",
      label: "SEO",
      type: "group",
      localized: true,
      fields: [
        OverviewField({
          titlePath: "meta.title",
          descriptionPath: "meta.description",
          imagePath: "meta.image",
        }),
        MetaTitleField({
          hasGenerateFn: true,
        }),
        MetaImageField({
          relationTo: "media",
        }),

        MetaDescriptionField({}),
        PreviewField({
          // if the `generateUrl` function is configured
          hasGenerateFn: true,

          // field paths to match the target field for data
          titlePath: "meta.title",
          descriptionPath: "meta.description",
        }),
      ],
    },
  ],
};

export default Tags;
