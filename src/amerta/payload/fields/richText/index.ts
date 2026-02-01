import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { SlateToLexicalFeature } from '@payloadcms/richtext-lexical/migrate'

import type { RichTextField } from "payload";
import { LexicalFieldAdminClientProps } from "@payloadcms/richtext-lexical/dist/types";
import deepmerge from "deepmerge";

type RichText = (overrides?: Partial<RichTextField> & { admin?: LexicalFieldAdminClientProps }) => RichTextField;

const richText: RichText = (overrides) => {
  const options = deepmerge<LexicalFieldAdminClientProps, LexicalFieldAdminClientProps>(overrides?.admin || {}, {});

  const fieldOverrides = {
    ...(overrides || {}),
  };

  delete fieldOverrides.admin;

  return deepmerge<RichTextField, Partial<RichTextField>>(
    {
      name: "richText",
      type: "richText",
      required: true,
      editor: lexicalEditor({
        admin: options,
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature(), SlateToLexicalFeature({})];
        },
      }),
    },
    fieldOverrides || {}
  );
};

export default richText;
