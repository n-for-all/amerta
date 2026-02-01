import { admins } from "@/amerta/access/admins";
import { customerOrAnonymous } from "@/amerta/access/customerOrAnonymous";
import { CollectionConfig } from "payload";
import { getCartHandler } from "./handlers/get-cart";
import { addCartItem } from "./handlers/add-cart-item";
import { removeCartItem } from "./handlers/remove-cart-item";
import { updateItemQuantity } from "./handlers/update-item-quantity";
import { clearCart } from "./handlers/clear-cart";
import { applyCoupon } from "./handlers/apply-coupon";
import { removeCoupon } from "./handlers/remove-coupon";
import { checkAbandoned } from "./hooks/check-abandoned";
import { generateCartId } from "@/amerta/theme/utilities/get-cart";

export const Cart: CollectionConfig = {
  slug: "cart",
  admin: {
    useAsTitle: "cartId",
    group: "Ecommerce",
  },
  access: {
    read: () => true,
    create: customerOrAnonymous,
    update: customerOrAnonymous,
    delete: admins,
  },
  fields: [
    {
      name: "items",
      type: "array",
      required: false,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
        },
        {
          name: "price",
          type: "number",
          required: true,
          admin: {
            description: "Price of the product at the time it was added to the cart",
          },
        },
        {
          name: "salePrice",
          type: "number",
          required: false,
          admin: {
            description: "Sale price of the product at the time it was added to the cart",
          },
        },
        {
          name: "variantOptions",
          type: "array",
          required: false,
          fields: [
            {
              name: "option",
              type: "relationship",
              relationTo: "product-options",
              required: true,
            },
            {
              name: "value",
              type: "text",
              required: true,
              admin: {
                description: "Selected value for this option (e.g., 'Red', 'Large')",
              },
            },
          ],
          admin: {
            description: "Selected variant options",
          },
        },
      ],
    },
    {
      name: "cartId",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Unique cart identifier (generated automatically)",
        readOnly: true,
      },
      hooks: {
        beforeValidate: [
          async ({ value }) => {
            // Generate unique cart ID if not provided
            if (!value) {
              return generateCartId();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: false,
      admin: {
        description: "Customer linked when logged in",
      },
    },
    {
      name: "sessionId",
      type: "text",
      required: false,
      unique: true,
      admin: {
        description: "Unique session identifier for anonymous carts",
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Abandoned",
          value: "abandoned",
        },
        {
          label: "Completed",
          value: "completed",
        },
      ],
      admin: {
        description: "Cart status",
      },
    },
    {
      name: "expiryDate",
      type: "date",
      required: true,
      admin: {
        description: "Date when cart expires and becomes abandoned",
      },
      hooks: {
        beforeValidate: [
          async ({ value }) => {
            // Set default expiry date to 30 days from now if not provided
            if (!value) {
              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + 30);
              return expiryDate.toISOString().split("T")[0];
            }
            return value;
          },
        ],
      },
    },
    {
      name: "appliedCoupon",
      type: "relationship",
      relationTo: "coupons",
      required: false,
      admin: {
        description: "Applied coupon code",
      },
    },
    {
      name: "appliedRules",
      type: "relationship",
      relationTo: "cart-rules",
      hasMany: true,
      required: false,
      admin: {
        description: "Applied cart rules",
      },
    },
  ],
  hooks: {
    beforeChange: [checkAbandoned],
  },
  timestamps: true,
  labels: {
    singular: "Cart",
    plural: "Carts",
  },
  endpoints: [
    {
      path: "/get",
      method: "get",
      handler: getCartHandler,
    },
    {
      path: "/add",
      method: "post",
      handler: addCartItem,
    },
    {
      path: "/remove",
      method: "post",
      handler: removeCartItem,
    },
    {
      path: "/update-quantity",
      method: "post",
      handler: updateItemQuantity,
    },
    {
      path: "/clear",
      method: "post",
      handler: clearCart,
    },
    {
      path: "/apply-coupon",
      method: "post",
      handler: applyCoupon,
    },
    {
      path: "/remove-coupon",
      method: "post",
      handler: removeCoupon,
    },
  ],
};
