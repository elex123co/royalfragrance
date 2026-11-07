import { CONTENT_FIELDS, CONTENT_GROUPS } from "@/lib/content/registry";
import { getOverridesFresh } from "@/lib/content/server";
import { ContentEditor } from "@/components/admin/ContentEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Text — Admin — Royal Fragrance" };

export default async function AdminContentPage() {
  let overrides: Record<string, string> = {};
  let missingTable = false;
  try {
    overrides = await getOverridesFresh();
  } catch {
    missingTable = true;
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-espresso">Site Text</h1>
      <p className="mb-6 max-w-3xl text-sm text-rich/70">
        Edit the wording that appears across the website. Pick a page, change any text, and press Save. The change
        goes live straight away. Each box shows the original wording, and Reset puts it back.
      </p>
      {missingTable && (
        <p className="mb-6 rounded-xl2 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          The site_content table has not been created yet. Run supabase/site-content.sql in the Supabase SQL editor,
          then reload this page.
        </p>
      )}
      <ContentEditor
        groups={[...CONTENT_GROUPS]}
        fields={CONTENT_FIELDS}
        overrides={overrides}
      />
    </div>
  );
}
