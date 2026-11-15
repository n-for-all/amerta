import React, { Fragment } from "react";

import { Page } from "@/payload-types";
import { toKebabCase } from "@/amerta/utilities/toKebabCase";
import { ThemeShopHeroBlock } from "@/amerta/theme/blocks/general/Hero/Component";
import { SmoothScroll } from "@/amerta/theme/blocks/common/SmoothScroll";
import { ThemeShopCollectionShowcaseBlock } from "@/amerta/theme/blocks/general/CollectionShowcase/Component";
import { ThemeShopCTAFeatureBlock } from "@/amerta/theme/blocks/general/CTAFeature/Component";
import { ThemeShopGridShowcaseBlock } from "@/amerta/theme/blocks/general/GridShowcase/Component";
import { ThemeShopNewsletterBlock } from "@/amerta/theme/blocks/general/Newsletter/Component";
import { ThemeShopCollectionArchive } from "@/amerta/theme/blocks/general/CollectionArchive/Component";
import { ThemeShopFeaturesBlock } from "@/amerta/theme/blocks/general/ShopFeatures/Component";
import { ThemeShopBenefitsBlock } from "@/amerta/theme/blocks/general/Benefits/Component";
import { ThemeShopBlogPostsBlock } from "@/amerta/theme/blocks/general/BlogPosts/Component";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { ThemeShopContactUsBlock } from "@/amerta/theme/blocks/general/ContactUs/Component";
import { ThemeShopContentBlock } from "@/amerta/theme/blocks/general/Content/Component";
import { ThemeShopImageBlock } from "@/amerta/theme/blocks/general/Image/Component";
import { ThemeShopSpacerBlock } from "@/amerta/theme/blocks/general/Spacer/Component";
import { ThemeShopHeroVideoBlock } from "@/amerta/theme/blocks/general/HeroVideo/Component";
import { ThemeShopIntegrationGridBlock } from "@/amerta/theme/blocks/general/IntegrationGrid/Component";

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
  themeShopHeroVideo: ThemeShopHeroVideoBlock,
  themeShopIntegrationGrid: ThemeShopIntegrationGridBlock,
};

export const Blocks: React.FC<{
  blocks?: NonNullable<Page["layout"]>[number][] | null;
  params?: Record<string, string | string[] | undefined | null>;
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
