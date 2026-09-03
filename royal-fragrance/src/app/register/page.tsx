export const metadata = { title: "Create Account — Royal Fragrance" };

export default function Page() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-32 text-center lg:px-8">
      <span className="text-xs uppercase tracking-[0.2em] text-caramel">
        Royal Fragrance
      </span>
      <h1 className="mt-3 font-display text-3xl text-espresso sm:text-4xl">
        Create Account
      </h1>
      <p className="mt-4 text-rich/70">
        Customer registration form backed by Supabase Auth.
      </p>
    </section>
  );
}
