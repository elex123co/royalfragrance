/**
 * Filters a vendor_inventory query to one specific size. A missing size must
 * be matched with IS NULL: ".eq('variant_id', null)" matches nothing, which
 * is what made the same product get inserted again as a new row every time
 * stock was assigned without a size.
 */
export function withVariant<Q>(query: Q, variantId: string | null | undefined): Q {
  const q = query as any;
  return (variantId ? q.eq("variant_id", variantId) : q.is("variant_id", null)) as Q;
}
