import { hasStock } from "@/amerta/theme/utilities/has-stock";
import { ProductListingPrice } from "../ProductPrice";
import { ImageOrPlaceholder } from "../Thumbnail";
import { Product, ProductBrand, ProductOption } from "@/payload-types";
import AddToCartForm from "@/amerta/theme/components/AddToCartForm";
import { WishlistButton } from "@/amerta/theme/components/WishlistButton";
import { cn } from "@/amerta/utilities/ui";
import { getURL } from "@/amerta/utilities/getURL";

export const ProductCard = ({ product, cartIcon, options, locale, className, vertical }: { product: Product; cartIcon?: React.ReactNode; options: ProductOption[]; locale?: string; className?: string; vertical?: boolean }) => {
  const productImage = product.images && product.images.length > 0 ? product.images[0] : null;
  const secondImage = product.images && product.images.length > 1 ? product.images[1] : null;
  const productName = product.title;
  const productSlug = product.slug || product.id;
  const stockAvailable = hasStock(product);

  // Get image URL for preloading
  const getImageUrl = (image: any) => {
    if (!image) return null;
    if (typeof image === "string") return image;
    return image?.url || null;
  };

  const secondImageUrl = getImageUrl(secondImage);

  if (vertical) {
    const excerpt = product.excerpt || "";
    return (
      <div key={product.id} className={cn("relative flex py-4 w-full group/prd hover:bg-gray-50", className)}>
        <div className="relative flex-shrink-0 w-24 mt-4 ml-4 group/collection">
          {/* Preload second image on hover */}
          {secondImageUrl && <link rel="preload" as="image" href={secondImageUrl} />}
          <a href={getURL(`/product/${productSlug}`, locale)} className="relative block w-full overflow-hidden aspect-3/4">
            <ImageOrPlaceholder className={"z-0 object-contain w-full h-full transition-opacity duration-300 rounded-lg " + (secondImage ? "group-hover/prd:opacity-0" : "")} image={productImage} />
            {secondImage && <ImageOrPlaceholder className="absolute inset-0 z-10 object-contain w-full h-full transition-opacity duration-300 rounded-lg opacity-0 group-hover/prd:opacity-100" image={secondImage} />}
          </a>
          {product.brand && (
            <div className="absolute top-3 left-3">
              <div className="rounded-full bg-white px-3.5 py-1.5 text-xs leading-none text-zinc-900 uppercase dark:bg-zinc-800 dark:text-white">{(product.brand as ProductBrand)?.title}</div>
            </div>
          )}
          <WishlistButton product={product} variant="ghost" className="absolute z-20 top-3 right-3" />
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4">
          <div className="flex flex-col gap-2 text-xs uppercase">
            <a className="flex-1 text-sm font-medium uppercase" href={getURL(`/product/${productSlug}`, locale)}>
              {productName}
            </a>
            {excerpt}
          </div>
          <div className="flex flex-col gap-2">
            <AddToCartForm icon={cartIcon} compact product={product} className="mb-0" options={options} buttonVariant="ghost" buttonClassName="" />
            <ProductListingPrice product={product} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={product.id} className={cn("relative w-full group/prd hover:bg-gray-50 h-full dark:hover:bg-zinc-900", className)}>
      {/* Preload second image on hover */}
      {secondImageUrl && <link rel="preload" as="image" href={secondImageUrl} />}
      <a href={getURL(`/product/${productSlug}`, locale)} className="relative block w-full overflow-hidden aspect-3/4">
        <ImageOrPlaceholder className={"z-0 object-contain w-full h-full transition-opacity duration-300 rounded-lg " + (secondImage ? "group-hover/prd:opacity-0" : "")} image={productImage} />
        {secondImage && <ImageOrPlaceholder className="absolute inset-0 z-10 object-contain w-full h-full transition-opacity duration-300 rounded-lg opacity-0 group-hover/prd:opacity-100" image={secondImage} />}
      </a>
      {product.brand && (
        <div className="absolute top-3 left-3">
          <div className="rounded-full bg-white px-3.5 py-1.5 text-xs leading-none text-zinc-900 uppercase dark:bg-zinc-800 dark:text-white">{(product.brand as ProductBrand)?.title}</div>
        </div>
      )}
      <WishlistButton product={product} variant="ghost" className="absolute z-20 top-3 right-3" />
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <a className="flex-1 uppercase text-sm/6" href={getURL(`/product/${productSlug}`, locale)}>
            {productName}
          </a>
        </div>
        <div className="">
          <AddToCartForm icon={cartIcon} compact product={product} className="mb-0" options={options} buttonVariant="ghost" buttonClassName="absolute top-3 right-14 z-20" />
        </div>
        <div className="">
          <ProductListingPrice product={product} />
        </div>
        <p className={`text-xs text-sm/6 uppercase ${stockAvailable ? "text-green-500 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{stockAvailable ? "In Stock" : "Out of Stock"}</p>
      </div>
    </div>
  );
};
