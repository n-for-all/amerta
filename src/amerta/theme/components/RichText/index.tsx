import React, { useMemo } from "react"; // Added useMemo
import { DefaultNodeTypes, SerializedBlockNode, SerializedLinkNode } from "@payloadcms/richtext-lexical";
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { JSXConvertersFunction, LinkJSXConverter, RichText as RichTextWithoutBlocks } from "@payloadcms/richtext-lexical/react";
import type { ThemeShopBannerBlock as BannerBlockProps, ThemeShopMediaBlock as ThemeShopMediaBlockProps } from "@/payload-types";

import { cn } from "@/amerta/utilities/ui";

import { ThemeShopCallToActionTextBlock } from "@/amerta/theme/blocks/general/CallToActionText/Component";
import { FormBlock } from "@/amerta/components/Form/Component";
import { renderSubmitButton } from "./formButton";
import { ThemeShopMediaBlock } from "@/amerta/theme/blocks/general/MediaBlock/Component";
import { ThemeShopCodeBlock, ThemeShopCodeBlockProps } from "@/amerta/theme/blocks/general/Code/Component";
import { ThemeShopBannerBlock } from "@/amerta/theme/blocks/general/Banner/Component";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import { CollectionSlug } from "payload";

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<ThemeShopMediaBlockProps | BannerBlockProps | ThemeShopCodeBlockProps>;

type Props = {
  data?: SerializedEditorState | null;
  enableGutter?: boolean;
  enableProse?: boolean;
  locale?: string; // <--- 1. Add locale prop here
} & React.HTMLAttributes<HTMLDivElement>;

export default function RichText(props: Props) {
  const { className, enableProse = true, enableGutter = true, locale, ...rest } = props;
  const converters = useMemo<JSXConvertersFunction<NodeTypes>>(() => {
    const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
      const { value, relationTo } = linkNode.fields.doc!;
      if (typeof value !== "object") {
        throw new Error("Expected value to be an object");
      }

      const url = getLinkUrl({
        type: linkNode.fields.linkType == "internal" ? "reference" : "custom",
        reference: {
          relationTo: relationTo as CollectionSlug,
          value: value as any,
        },
        locale,
        url: linkNode.fields.url || null,
      });
      return url;
    };

    return ({ defaultConverters }) => ({
      ...defaultConverters,
      ...LinkJSXConverter({ internalDocToHref }),
      blocks: {
        banner: ({ node }) => <ThemeShopBannerBlock className="col-start-2 mb-4" {...node.fields} />,
        mediaBlock: ({ node }) => <ThemeShopMediaBlock className="col-span-3 col-start-1" imgClassName="m-0" {...node.fields} captionClassName="mx-auto max-w-[48rem]" enableGutter={false} disableInnerContainer={true} />,
        code: ({ node }) => <ThemeShopCodeBlock className="col-start-2" {...node.fields} />,
        cta: ({ node }) => <ThemeShopCallToActionTextBlock {...node.fields} />,
        formBlock: ({ node }) => {
          return <FormBlock id={"footerForm"} enableIntro className="w-full rounded-md" form={node.fields.form as any} renderSubmitButton={renderSubmitButton} />;
        },
      },
    });
  }, [locale]); // Re-run if locale changes

  return (
    <RichTextWithoutBlocks
      converters={converters}
      className={cn(
        {
          "max-w-7xl w-full ": enableGutter,
          "max-w-none": !enableGutter,
          "w-full prose md:prose-md dark:prose-invert ": enableProse,
        },
        className,
        "[&_*]:rtl:![text-align:inherit]",
      )}
      {...rest}
      data={props.data || { root: { type: "paragraph", version: 1, children: [], direction: "ltr", format: "left", indent: 0 } }}
    />
  );
}
