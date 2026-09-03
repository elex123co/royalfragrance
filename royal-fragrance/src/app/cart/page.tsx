export const metadata = { title: "Your Cart — Royal Fragrance" };

export default function Page() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center lg:px-8">
      <span className="text-xs uppercase tracking-[0.2em] text-caramel">
        Royal Fragrance
      </span>
      <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
        Your Cart
      </h1>
      <p className="mt-4 text-rich/70">
        Cart page — subtotal, delivery fee, and total, backed by client-side cart state or a cart table.
      </p>
    </section>
  );
}
