import { type Product } from "@/payload-types";

export const generateProductJSONLD = (product: Product, currency: any, url: string) => {
  const brandName = typeof product.brand === 'object' && product.brand ? product.brand.title : undefined;
  
  const defaultImage = product.meta?.image && typeof product.meta.image === 'object' 
    ? product.meta.image.url 
    : (product.images && product.images.length > 0 && typeof product.images[0] === 'object' 
        ? product.images[0].url 
        : undefined);

  const currencyCode = (currency?.code || "USD").toUpperCase();

  const commonData: any = {
    "@context": "https://schema.org",
    "name": product.title,
    "description": product.meta?.description || product.excerpt || product.title,
    "url": url,
  };

  if (defaultImage) {
    commonData.image = [defaultImage];
  }

  if (brandName) {
    commonData.brand = {
      "@type": "Brand",
      "name": brandName
    };
  }

  if (product.type === 'variant' && product.variants && product.variants.length > 0) {
    const variesBySet = new Set<string>();
    product.variants.forEach(v => {
      if (v.variant) {
        Object.values(v.variant).forEach(opt => {
          if (opt.name) variesBySet.add(`https://schema.org/${opt.name.toLowerCase()}`);
        });
      }
    });

    return {
      ...commonData,
      "@type": "ProductGroup",
      "productGroupID": product.sku || product.id,
      "variesBy": Array.from(variesBySet),
      "hasVariant": product.variants.map(v => {
        const variantNameParts: string[] = [];
        let colorValue;
        let sizeValue;
        let weightValue;
        let materialValue;
        let patternValue;

        if (v.variant) {
          Object.values(v.variant).forEach(opt => {
            variantNameParts.push(opt.value);
            const optName = opt.name?.toLowerCase() || '';
            if (optName === 'color') colorValue = opt.value;
            if (optName === 'size') sizeValue = opt.value;
            if (optName === 'weight') weightValue = opt.value;
            if (optName === 'material') materialValue = opt.value;
            if (optName === 'pattern') patternValue = opt.value;
          });
        }
        const variantName = variantNameParts.length > 0 ? `${product.title} - ${variantNameParts.join(' ')}` : product.title;
        
        const variantImage = v.image && typeof v.image === 'object' ? v.image.url : defaultImage;
        
        const variantData: any = {
          "@type": "Product",
          "sku": v.sku || product.sku || `${product.id}-${v.id}`,
          "name": variantName,
          "offers": {
            "@type": "Offer",
            "url": `${url}?variant=${v.id}`,
            "priceCurrency": currencyCode,
            "price": v.price?.toString(),
            "availability": v.stockStatus === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          }
        };
        
        if (variantImage) variantData.image = [variantImage];
        if (v.barcode) variantData.gtin13 = v.barcode;
        if (colorValue) variantData.color = colorValue;
        if (sizeValue) variantData.size = sizeValue;
        if (weightValue) variantData.weight = weightValue;
        if (materialValue) variantData.material = materialValue;
        if (patternValue) variantData.pattern = patternValue;
        
        return variantData;
      })
    };
  } else {
    return {
      ...commonData,
      "@type": "Product",
      "sku": product.sku || product.id,
      "gtin13": product.barcode,
      "offers": {
        "@type": "Offer",
        "url": url,
        "priceCurrency": currencyCode,
        "price": product.price?.toString(),
        "availability": product.stockStatus === 'in_stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      }
    };
  }
};
