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
