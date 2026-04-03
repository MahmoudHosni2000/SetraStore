-- Update the products_category_check constraint to include new categories
-- First, drop the existing constraint. We'll use a DO block to find the name if it's not the default.
DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass 
      AND contype = 'c' 
      AND pg_get_constraintdef(oid) LIKE '%category%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE products DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

-- Add the updated constraint
ALTER TABLE products ADD CONSTRAINT products_category_check 
CHECK (category IN (
    'Makeup', 
    'Skincare', 
    'Haircare', 
    'Fragrance', 
    'Bath & Body', 
    'Men''s Grooming', 
    'Tools & Accessories', 
    'Wellness', 
    'Sun Care'
));
