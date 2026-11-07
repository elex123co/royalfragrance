import { getT } from "@/lib/content/server";
export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  role?: string;
}

/**
 * Testimonials are managed from the admin dashboard (see supabase/schema.sql
 * `testimonials` table). This component accepts real data as a prop — no
 * fake reviews are hardcoded here. When empty, it renders nothing on the
 * public site.
 */
export async function Testimonials({
  testimonials = [],
}: {
  testimonials?: Testimonial[];
}) { const _t = await getT();
  if (testimonials.length === 0) return null;

  return (
    <section className="bg-brand-100/40 py-24">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs uppercase tracking-[0.2em] text-caramel">{_t("home.testimonials.9e1438", "What People Say")}</span>
          <h2 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">{_t("home.testimonials.8b40f0", "Loved by Our Customers")}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="rounded-xl2 bg-white/60 p-6 shadow-premium-sm"
            >
              <p className="text-sm italic text-rich/85">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 font-display text-sm text-espresso">
                {t.name}
              </p>
              {t.role && (
                <p className="text-xs text-rich/60">{t.role}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
