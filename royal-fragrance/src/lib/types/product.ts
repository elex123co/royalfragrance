export type ProductStatus = "active" | "draft" | "out_of_stock";
export type DiscountType = "percentage" | "fixed_amount";

export interface ProductVariant {
  id: string;
  size: string; // e.g. "50ml"
  price: number; // effective price after any active discount
  originalPrice?: number; // set only when a discount is active, for strikethrough display
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number; // effective price after any active discount
  originalPrice?: number; // set only when a discount is active, for strikethrough display
  discountType?: DiscountType;
  discountValue?: number;
  /** e.g. "Up to 15% off with code" — set only when the product has at
   * least one promo-code-only discount tier. Never reveals the actual
   * code, and never changes the shown price on its own. */
  promoTierLabel?: string;
  colors?: string[];
  image: string;
  notes?: {
    top?: string[];
    heart?: string[];
    base?: string[];
  };
  variants?: ProductVariant[];
  status: ProductStatus;
  featured?: boolean;
}
