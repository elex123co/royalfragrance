export type ProductStatus = "active" | "draft" | "out_of_stock";

export interface ProductVariant {
  id: string;
  size: string; // e.g. "50ml"
  price: number; // in kobo/lowest currency unit, or naira — keep consistent app-wide
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number; // base display price (₦)
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
