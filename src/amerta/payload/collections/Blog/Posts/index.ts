import type { CollectionConfig } from "payload";

import { BlocksFeature, FixedToolbarFeature, HeadingFeature, HorizontalRuleFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { populateAuthors } from "./hooks/populateAuthors";
import { revalidateDelete, revalidatePost } from "./hooks/revalidatePost";

import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields";
import { slugField } from "@/amerta/fields/slug";

import { adminsOrPublished } from "@/amerta/access/adminsOrPublished";
import { admins } from "@/amerta/access/admins";
import { ThemeShopMediaBlock } from "@/amerta/theme/blocks/general/MediaBlock/config";
import { ThemeShopBannerBlock } from "@/amerta/theme/blocks/general/Banner/config";
import { ThemeShopCodeBlock } from "@/amerta/theme/blocks/general/Code/config";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

export const Posts: CollectionConfig<"posts"> = {
  slug: "posts",
  trash: true,
  access: {
    create: admins,
    delete: admins,
    read: adminsOrPublished,
    update: admins,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    categories: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    group: "Blog",
    defaultColumns: ["title", "slug", "updatedAt"],
    livePreview: {
      url: ({ data, locale }) => {
        return getURL(`/blog/article/${typeof data?.slug === "string" ? data.slug : ""}`, locale.code);
      },
    },
    preview: (doc, { locale }) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(`${getURL(`/blog/article/${doc.slug}`, locale)}`)}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
    useAsTitle: "title",
    components: {
      edit: {
        beforeDocumentControls: ["@/amerta/fields/translate/AIAgentButton#AIAgentButton"],
      },
    },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: false,
      localized: true,
      admin: {
        description: "A short summary or excerpt of the blog post.",
        rows: 5,
      },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Featured Post",
      required: false,
      defaultValue: false,
      admin: {
        description: "Mark this post as featured to highlight it in special sections.",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          fields: [
            {
              name: "heroImage",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "relatedPosts",
              type: "relationship",
              admin: {
                position: "sidebar",
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                };
              },
              hasMany: true,
              relationTo: "posts",
            },
            {
              name: "content",
              localized: true,
              type: "richText",
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [...rootFeatures, HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }), BlocksFeature({ blocks: [ThemeShopBannerBlock, ThemeShopCodeBlock, ThemeShopMediaBlock] }), FixedToolbarFeature(), InlineToolbarFeature(), HorizontalRuleFeature()];
                },
              }),
              label: false,
              required: true,
            },
          ],
          label: "Content",
        },
        {
          name: "meta",
          localized: true,
          label: "SEO",
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
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
        position: "sidebar",
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
      name: "authors",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "users",
    },
    {
      name: "categories",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "categories",
    },
    {
      name: "tags",
      type: "relationship",
      admin: {
        position: "sidebar",
      },
      hasMany: true,
      relationTo: "tags",
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    {
      name: "populatedAuthors",
      type: "array",
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        {
          name: "id",
          type: "text",
        },
        {
          name: "name",
          type: "text",
        },
      ],
    },
    ...slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 500, // We set this interval for optimal live preview
      },
      schedulePublish: true,
      localizeStatus: true,
    },
    maxPerDoc: 5,
  },
};
