"use client";

import * as React from "react";
import { useField, useFormFields, Select } from "@payloadcms/ui";
import { Product } from "@/payload-types";

type MetaData = {
  id: string;
  subtitle: null | string;
  title: string;
  sku: string | null;
  weight: number | null;
  length: number | null;
  height: number | null;
  width: number | null;
  variant: { [k: string]: unknown } | null;
};

type VariantOption = {
  label?: string;
  value?: unknown;
  price?: number;
  quantity?: number | null;
  maxStock?: number | null;
  trackInventory?: boolean;
  metaData?: MetaData;
};

const ProductVariant: React.FC<{ path: string }> = ({ path }) => {
  // 1. Manage this field's value (The Variant ID)
  const { value, setValue } = useField<{ label: string; value: string }>({ path });
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // 2. dynamically find the sibling 'product', 'price', and 'quantity' field paths
  // If current path is 'items.0.variant', sibling is 'items.0.product', 'items.0.price', 'items.0.quantity'
  const productPath = path.replace(".variant", ".product");
  const pricePath = path.replace(".variant", ".price");
  const quantityPath = path.replace(".variant", ".quantity");
  const metaDataPath = path.replace(".variant", ".metaData");

  // 3. Watch the sibling Product ID and Price field for changes
  const productID = useFormFields(([fields]) => {
    return fields[productPath]?.value as string;
  });

  const { value: priceValue, setValue: setPrice } = useField<number>({ path: pricePath });
  const { value: quantityValue, setValue: setQuantity } = useField<number>({ path: quantityPath });
  const { value: metaDataValue, setValue: setMetaData } = useField<MetaData>({ path: metaDataPath });

  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);

  // 4. When Product ID changes, fetch that product's specific variants
  React.useEffect(() => {
    // If no product is selected, clear options
    if (!productID) {
      setOptions([]);
      setShow(false);
      setValue(null); // Clear the selected variant if product is removed
      return;
    }

    const fetchVariants = async () => {
      setShow(true);
      setError(null);
      try {
        // Fetch the full product document
        const res = await fetch(`/api/products/${productID}`);
        const product: Product = await res.json();

        if (product.type === "simple") {
          setOptions([]);
          setValue(null); // Clear variant selection for simple products
          // Auto-fill price for simple products
          const price = product.salePrice || product.price || 0;
          setPrice(price);
          setShow(false);
          setMetaData({
            id: product.id || "",
            subtitle: null,
            title: product.title || "",
            sku: product.sku || null,
            weight: product.weight || null,
            length: product.length || null,
            height: product.height || null,
            width: product.width || null,
            variant: null,
          });
          return;
        }

        // Check if this product has variants
        if (Array.isArray(product.variants)) {
          // Map them to the options format Payload expects
          const validOptions = product.variants.map((v) => {
            let variantName = "";
            let variantOptions = v.variant || {};
            Object.keys(variantOptions).forEach((key) => {
              variantName += `${variantOptions[key].name}: ${variantOptions[key].value} `;
            });

            let maxStock = -1;
            if (v.trackInventory && v.quantity) {
              // Set quantity to 1 if not already set
              if (!v.quantity || v.quantity === 0) {
                maxStock = 1;
              } else {
                maxStock = v.quantity;
              }
            }
            return {
              id: product.id || "",
              label: `Variant ${v.id} ${variantName}`, // Adjust 'name' to your field
              value: v.id || "",
              price: v.salePrice || v.price || 0,
              quantity: v.quantity || null,
              maxStock: maxStock,
              trackInventory: v.trackInventory || false,
              metaData: {
                sku: v.sku || null,
                weight: v.weight || null,
                length: v.length || null,
                height: v.height || null,
                width: v.width || null,
                title: product.title || "",
                subtitle: variantName.trim(),
                variant: {
                  ...(variantOptions as {
                    [k: string]: unknown;
                  }),
                  id: v.id,
                },
              },
            }; // We save the Variant ID
          });
          setOptions(validOptions);
        } else {
          setOptions([]);
        }
        setShow(true);
      } catch (error) {
        setOptions([]);
        setError("Failed to load variants: " + (error as Error).message);
      }
    };

    fetchVariants();
  }, [productID, setValue, setPrice]);

  return (
    <>
      {show ? (
        <div className="field-type select">
          <label className="field-label">Variant</label>
          <Select
            options={options}
            value={value}
            onChange={(option: VariantOption | VariantOption[]) => {
              if (Array.isArray(option)) return; // We don't support multi-select here
              setValue({ label: option.label || "", value: option.value as string });
              setPrice((option as VariantOption)?.price || 0);
              setQuantity(1);
              setMetaData((option as VariantOption).metaData);
            }}
            // If options are empty, disable the input
            disabled={options.length === 0}
            isMulti={false}
            showError={error !== null}
          />
          {options.length === 0 && productID && <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>No variants found for this product.</div>}
        </div>
      ) : null}
    </>
  );
};

export default ProductVariant;
