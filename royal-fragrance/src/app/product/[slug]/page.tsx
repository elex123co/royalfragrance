export const metadata = { title: "Product Details — Royal Fragrance" };

export default function Page() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center lg:px-8">
      <span className="text-xs uppercase tracking-[0.2em] text-caramel">
        Royal Fragrance
      </span>
      <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
        Product Details
      </h1>
      <p className="mt-4 text-rich/70">
        Dynamic product page — fetch by slug from Supabase, render images, variants, notes and related products.
      </p>
    </section>
  );
}
