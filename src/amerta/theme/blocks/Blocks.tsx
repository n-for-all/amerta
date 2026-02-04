import React, { Fragment } from "react";

import { Page } from "@/payload-types";
import { toKebabCase } from "@/amerta/utilities/toKebabCase";
import { ThemeShopHeroBlock } from "./general/Hero/Component";
import { SmoothScroll } from "./common/SmoothScroll";
import { ThemeShopCollectionShowcaseBlock } from "./general/CollectionShowcase/Component";
import { ThemeShopCTAFeatureBlock } from "./general/CTAFeature/Component";
import { ThemeShopGridShowcaseBlock } from "./general/GridShowcase/Component";
import { ThemeShopNewsletterBlock } from "./general/Newsletter/Component";
import { ThemeShopCollectionArchive } from "./general/CollectionArchive/Component";
import { ThemeShopFeaturesBlock } from "./general/ShopFeatures/Component";
import { ThemeShopBenefitsBlock } from "./general/Benefits/Component";
import { ThemeShopBlogPostsBlock } from "./general/BlogPosts/Component";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { ThemeShopContactUsBlock } from "./general/ContactUs/Component";
import { ThemeShopContentBlock } from "./general/Content/Component";
import { ThemeShopImageBlock } from "./general/Image/Component";
import { ThemeShopSpacerBlock } from "./general/Spacer/Component";
import { ThemeShopHeroVideoBlock } from "./general/HeroVideo/Component";

const blockComponents = {
  themeShopHero: ThemeShopHeroBlock,
  themeShopCollectionShowcase: ThemeShopCollectionShowcaseBlock,
  themeShopCtaFeature: ThemeShopCTAFeatureBlock,
  themeShopGridShowcase: ThemeShopGridShowcaseBlock,
  themeShopNewsletterBlock: ThemeShopNewsletterBlock,
  themeShopCollectionArchive: ThemeShopCollectionArchive,
  themeShopFeaturesBlock: ThemeShopFeaturesBlock,
  themeShopBenefitsBlock: ThemeShopBenefitsBlock,
  themeShopBlogPosts: ThemeShopBlogPostsBlock,
  themeShopContactUs: ThemeShopContactUsBlock,
  themeShopContentBlock: ThemeShopContentBlock,
  themeShopImageBlock: ThemeShopImageBlock,
  themeShopSpacerBlock: ThemeShopSpacerBlock,
  themeShopHeroVideo: ThemeShopHeroVideoBlock
};

export const Blocks: React.FC<{
  blocks?: NonNullable<Page["layout"]>[number][] | null;
  params?: Record<string, string | string[] | undefined>;
}> = (props) => {
  const { blocks, params } = props; 

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;
  if (hasBlocks) {
    const filteredBlocks = blocks.filter((block) => !("hideOnFrontend" in block && block.hideOnFrontend));
    return (
      <Fragment>
        {filteredBlocks.map((block, index) => {
          const { blockName, blockType } = block;
          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType];
            if (Block) {
              try {
                return (
                  <Fragment key={index}>
                    <Block id={toKebabCase(blockName || blockType || "")} {...(block as any)} params={params} locale={params?.locale || DEFAULT_LOCALE} />
                  </Fragment>
                );
              } catch (error) {
                console.error(`Error rendering block '${blockName}, ${blockType}':`, error);
                return (
                  <div key={index}>
                    Error rendering block {blockName}, {blockType}
                  </div>
                );
              }
            } else {
              return <div key={index}>Block Type: {blockType} not found</div>;
            }
          }
          return (
            <div key={index}>
              Block: {blockName} not found, missing blockType: {blockType}
            </div>
          );
        })}
        <SmoothScroll />
      </Fragment>
    );
  }

  return null;
};
