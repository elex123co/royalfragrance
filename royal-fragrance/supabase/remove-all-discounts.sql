-- Turns off the sale discount on every product.
update products
set discount_type = null, discount_value = null
where discount_type is not null or discount_value is not null;

-- Optional: also remove the promo discount tiers on products. Uncomment to run.
-- delete from product_discount_tiers;

-- Check: should return 0 rows.
select id, name, discount_type, discount_value
from products
where discount_type is not null or discount_value is not null;
