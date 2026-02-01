import { Cart } from "@/payload-types";
import { CartWithCalculations } from "@/amerta/theme/types";
import { createCartIfNotExists } from "@/amerta/theme/utilities/create-cart-if-not-exists";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { getProductPrice } from "@/amerta/theme/utilities/get-product-price";
import { isInStock } from "@/amerta/theme/utilities/is-in-stock";
import { variantsMatch } from "@/amerta/theme/utilities/variants-match";
import { PayloadRequest } from "payload";
import z from "zod";

const variantOptionSchema = z.object({
  option: z.string(),
  value: z.string(),
});

const addToCartSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive().optional().default(1),
  variantOptions: z.array(variantOptionSchema).optional(),
});

export const addCartItem = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    const cart: CartWithCalculations | null = await getCart(cartIdCookie);

    const body = await req.json!();
    const validation = addToCartSchema.safeParse(body);

    if (!validation.success) {
      console.error("Add to cart validation errors:", validation.error);
      return Response.json({ error: "Error adding item to cart" }, { status: 400 });
    }

    const { product, quantity = 1, variantOptions } = validation.data;
    const productDoc = await req.payload.findByID({
      collection: "products",
      id: product,
    });

    if (!productDoc) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    const items: Cart["items"] = cart?.items || [];
    const existingItemIndex = items!.findIndex((item: any) => {
      const itemProductId = typeof item.product === "string" ? item.product : item.product.id;
      if (itemProductId === product) {
        if (productDoc.type === "variant") {
          return variantsMatch(item.variantOptions, variantOptions);
        }
        return true;
      }
      return false;
    });

    const allOptions = await getAllProductOptions();

    if (!variantOptions || variantOptions.length === 0) {
      // If product has options, ensure variant options are provided
      if (productDoc.type === "variant") {
        // get the options defined for the product
        const productOptions = Array.from(new Set((productDoc.variants || []).flatMap(({ variant }) => Object.keys(variant || {}))));
        const optionsLabels = productOptions.map((optionId) => {
          const option = allOptions.find((opt) => opt.id === optionId);
          return option ? option.label : optionId;
        });

        return Response.json({ error: `Please select a variant from: ${optionsLabels.join(", ")} to add this product cart` }, { status: 400 });
      }
    }

    if (!isInStock(productDoc, variantOptions, existingItemIndex >= 0 ? items![existingItemIndex]!.quantity + quantity : quantity)) {
      return Response.json({ error: productDoc.title + " is out of stock" }, { status: 400 });
    }

    if (existingItemIndex >= 0) {
      items![existingItemIndex]!.quantity += quantity;
    } else {
      const pricing = getProductPrice(productDoc, variantOptions);
      items!.push({ product: productDoc, price: pricing.price, salePrice: pricing.salePrice, quantity, variantOptions: variantOptions || [] });
    }

    // if this passes it will return correct items wth pricing
    await createCartIfNotExists(cart!.id);

    const newCart = await req.payload.update({
      collection: "cart",
      where: { cartId: { equals: cart!.id } },
      data: { items: items, status: "active" },
    });

    if (newCart.errors.length > 0) {
      // Throw the first error found so your catch block handles it
      const message = newCart.errors.map((err) => err.message).join(", ");
      throw new Error(message);
    }

    const populatedCart = await getCart(cart.id);

    return Response.json(
      { cart: populatedCart },
      {
        headers: {
          "Set-Cookie": `cartId=${cart.id}; Path=/; HttpOnly; SameSite=Strict`,
        },
      },
    );
  } catch (error: any) {
    console.error("error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
