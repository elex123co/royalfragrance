-- Optional clean-up. Older versions could create several rows for the same
-- product and size on one vendor (one with stock, others at 0). This folds
-- each group into a single row holding the combined quantity. Safe to re-run.
with grouped as (
  select vendor_id, product_id, variant_id,
         (array_agg(id order by updated_at desc))[1] as keep_id,
         sum(available_quantity) as total
  from vendor_inventory
  group by vendor_id, product_id, variant_id
  having count(*) > 1
)
update vendor_inventory v
set available_quantity = g.total, updated_at = now()
from grouped g
where v.id = g.keep_id;

delete from vendor_inventory v
using (
  select id from (
    select id,
           row_number() over (partition by vendor_id, product_id, variant_id order by updated_at desc) as rn
    from vendor_inventory
  ) t where rn > 1
) d
where v.id = d.id;
