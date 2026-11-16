import { Cart } from "@/payload-types";

export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountAmount?: number;
}

export interface CartWithCalculations {
  id: string;
  items?: Cart["items"] | null;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: AppliedCoupon | null | string;
  status: "active" | "abandoned" | "completed";
  /** Part of `discount` that comes from the coupon */
  couponDiscount?: number;
  /** Part of `discount` that comes from automatic offers (cart rules) */
  rulesDiscount?: number;
  /** An offer makes delivery free */
  freeDelivery?: boolean;
  /** Products added for free by offers (not in `items`, price 0) */
  gifts?: import("../utilities/cart").CartGift[];
  /** Offers applied to this cart */
  offers?: import("../utilities/cart").AppliedCartRule[];
  /** Offer messages: "Add AED 50 more for free delivery" (upsell) and "You get free delivery" (active) */
  offerMessages?: import("../utilities/cart").CartRulesResult["messages"];
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export type ShippingCity = {
  city: string;
  code: string;
  active: boolean;
};

export type ShippingCountry = {
  id: string;
  name: string;
  display_name: string;
  iso_2: string;
  iso_3: string;
  citiesType: "specific" | "all";
  cities: ShippingCity[];
};

export type LinkType = {
  type?: ("reference" | "custom") | null;
  reference?:
    | ({
        relationTo: "pages";
        value: string | Page;
      } | null)
    | ({
        relationTo: "posts";
        value: string | Post;
      } | null)
    | ({
        relationTo: "categories";
        value: string | Category;
      } | null);
  url?: string | null;
  newTab?: boolean | null;
  label: string;
};

export interface PaymentMethod {
  id: string;
  name: string;
  label: string;
  type: any;
  publicDescription?: string;
  icons?: {
    id?: string | null;
    image: string | Media;
  }[];

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
}