export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountAmount?: number;
}

export interface MinimalProduct {
  id: string;
  title: string;
  price: number;
  slug?: string | null;
  salePrice?: number | null;
  images?: Array<{ url?: string | null; alt?: string | null } | string> | null;
  type?: "simple" | "variant" | null;
  trackInventory?: boolean | null;
  quantity?: number | null;
}

export interface CartWithCalculations {
  id: string;
  items?: Cart["items"] | null;
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupon?: AppliedCoupon | null | string;
  status: "active" | "abandoned" | "completed";
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
    id?: string;
    image: string | Media;
  }[];

  createdAt: string;
  updatedAt: string;

  [key: string]: any;
}