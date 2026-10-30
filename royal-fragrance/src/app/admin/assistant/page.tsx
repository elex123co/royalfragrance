import { getGalleryItems } from "@/lib/data/gallery";
import { getCategories } from "@/lib/data/categories";
import { ProductAssistant } from "@/components/admin/ProductAssistant";

export const dynamic = "force-dynamic";
export const metadata = { title: "Product Assistant — Admin — Royal Fragrance" };

export default async function AssistantPage() {
  const [items, categories] = await Promise.all([getGalleryItems(), getCategories()]);
  return <ProductAssistant initialItems={items} categories={categories} />;
}
