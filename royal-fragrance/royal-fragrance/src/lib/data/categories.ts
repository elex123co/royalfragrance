import { createAdminClient } from "@/lib/supabase/server";

export async function getCategories() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");
  return data ?? [];
}
