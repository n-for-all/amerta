/**
 * @module Collections/Products
 * @title Products Collections
 * @description This module exports all the collections related to products, including media, reviews, options, collections, brand, and tags.
 */

import { ProductMedia } from "./ProductMedia";
import ProductReviews from "./ProductReviews";
import { Products } from "./Products";
import { ProductOptions } from "./ProductOptions";
import { ProductCollections } from "./ProductCollections";
import { ProductBrand } from "./ProductBrand";
import { ProductTags } from "./ProductTags";

export { Products, ProductCollections, ProductBrand, ProductTags, ProductOptions, ProductMedia, ProductReviews };
export default [Products, ProductCollections, ProductBrand, ProductTags, ProductOptions, ProductMedia, ProductReviews];
