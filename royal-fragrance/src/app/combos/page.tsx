import { getCombos } from "@/lib/data/combos";
import { ComboCard } from "@/components/shop/ComboCard";

export const metadata = {
  title: "Combos — Royal Fragrance",
  description: "Bundle deals on Royal Fragrance perfumes — save more when you buy together.",
};

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  const combos = await getCombos();

  return (
    <section className="bg-cream py-16">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">Bundle Deals</span>
          <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">Combos</h1>
          <p className="mt-2 text-rich/60">Curated pairings, priced together.</p>
        </div>

        {combos.length === 0 ? (
          <p className="text-center text-rich/60">No combos available right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
