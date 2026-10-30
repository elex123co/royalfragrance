export type GalleryStatus = "new" | "extracted" | "ready" | "published" | "duplicate" | "failed";

export interface GalleryVariant {
  size: string;
  price: number;
  stock: number;
}

export interface GalleryDraft {
  id: string;
  name: string;
  slug: string;
  caption: string;
  description: string;
  categoryId: string | null;
  type: string;
  status: string;
  notesSource: "carton" | "knowledge" | "none";
  notes: { top: string[]; heart: string[]; base: string[] };
  variants: GalleryVariant[];
  images: string[];
}

export interface GalleryItem {
  id: string;
  url: string;
  status: GalleryStatus;
  note: string | null;
  createdAt: string;
  product: GalleryDraft | null;
}
