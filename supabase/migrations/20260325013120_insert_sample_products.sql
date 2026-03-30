/*
  # Insert Sample Cosmetics Products

  This migration inserts sample beauty and cosmetics products across all categories:
  - Makeup products
  - Skincare products
  - Haircare products
  - Fragrance products
  
  Also includes sample coupons for testing
*/

-- Insert Makeup Products
INSERT INTO products (name, description, price, category, brand, image_url, stock, is_featured) VALUES
('Velvet Matte Lipstick', 'Long-lasting matte lipstick with rich, vibrant color that stays put all day. Infused with vitamin E for soft, smooth lips.', 24.99, 'Makeup', 'Luxe Beauty', 'https://images.pexels.com/photos/2533266/pexels-photo-2533266.jpeg?auto=compress&cs=tinysrgb&w=800', 150, true),
('Flawless Foundation', 'Full coverage liquid foundation with a natural finish. Available in 40 shades for all skin tones.', 42.00, 'Makeup', 'Perfect Skin', 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=800', 200, true),
('Glamour Eyeshadow Palette', '12-shade eyeshadow palette with matte and shimmer finishes. Highly pigmented and blendable.', 38.50, 'Makeup', 'Color Maven', 'https://images.pexels.com/photos/2113855/pexels-photo-2113855.jpeg?auto=compress&cs=tinysrgb&w=800', 100, false),
('Volume Max Mascara', 'Dramatic volume mascara that lengthens and thickens lashes without clumping.', 19.99, 'Makeup', 'Lash Queen', 'https://images.pexels.com/photos/3782786/pexels-photo-3782786.jpeg?auto=compress&cs=tinysrgb&w=800', 180, false),
('Radiant Blush Duo', 'Silky powder blush duo for a natural, healthy glow. Buildable color for day to night looks.', 28.00, 'Makeup', 'Bloom Beauty', 'https://images.pexels.com/photos/3373714/pexels-photo-3373714.jpeg?auto=compress&cs=tinysrgb&w=800', 120, true),
('Precision Eyeliner Pen', 'Waterproof liquid eyeliner with ultra-fine tip for precise, smudge-proof lines.', 16.50, 'Makeup', 'Line & Define', 'https://images.pexels.com/photos/3764548/pexels-photo-3764548.jpeg?auto=compress&cs=tinysrgb&w=800', 160, false),
('Nude Lip Gloss', 'Non-sticky lip gloss with high shine finish and subtle nude tint. Enriched with nourishing oils.', 14.99, 'Makeup', 'Glossy Girl', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800', 140, false),
('Highlighter Glow Stick', 'Creamy highlighter stick for instant radiance. Blends seamlessly for a natural glow.', 22.00, 'Makeup', 'Glow Up', 'https://images.pexels.com/photos/3373725/pexels-photo-3373725.jpeg?auto=compress&cs=tinysrgb&w=800', 90, false);

-- Insert Skincare Products
INSERT INTO products (name, description, price, category, brand, image_url, stock, is_featured) VALUES
('Hydrating Face Serum', 'Lightweight hyaluronic acid serum that deeply hydrates and plumps skin. Suitable for all skin types.', 45.00, 'Skincare', 'Pure Radiance', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800', 80, true),
('Vitamin C Brightening Cream', 'Powerful antioxidant cream that brightens and evens skin tone. Reduces dark spots and hyperpigmentation.', 52.99, 'Skincare', 'Glow Labs', 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800', 95, true),
('Gentle Foaming Cleanser', 'pH-balanced cleanser that removes makeup and impurities without stripping skin. Perfect for daily use.', 28.50, 'Skincare', 'Clean Beauty', 'https://images.pexels.com/photos/4041279/pexels-photo-4041279.jpeg?auto=compress&cs=tinysrgb&w=800', 150, false),
('Retinol Night Treatment', 'Advanced retinol formula that reduces fine lines and improves skin texture. For mature skin.', 68.00, 'Skincare', 'Youth Restore', 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800', 60, false),
('Nourishing Eye Cream', 'Rich eye cream that targets dark circles, puffiness, and fine lines. Contains caffeine and peptides.', 39.99, 'Skincare', 'Bright Eyes', 'https://images.pexels.com/photos/3785147/pexels-photo-3785147.jpeg?auto=compress&cs=tinysrgb&w=800', 110, false),
('Exfoliating Face Mask', 'Clay mask with gentle exfoliants that purifies pores and reveals smoother skin. Use weekly.', 32.00, 'Skincare', 'Spa Luxe', 'https://images.pexels.com/photos/3762882/pexels-photo-3762882.jpeg?auto=compress&cs=tinysrgb&w=800', 85, false),
('SPF 50 Sunscreen', 'Broad-spectrum sunscreen with lightweight texture. Protects against UVA and UVB rays.', 35.50, 'Skincare', 'Sun Shield', 'https://images.pexels.com/photos/4041392/pexels-photo-4041392.jpeg?auto=compress&cs=tinysrgb&w=800', 200, true),
('Rosewater Toner', 'Alcohol-free toner that balances pH and preps skin for serum. Made with real rose extract.', 24.99, 'Skincare', 'Botanical Beauty', 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800', 130, false);

-- Insert Haircare Products
INSERT INTO products (name, description, price, category, brand, image_url, stock, is_featured) VALUES
('Repair Shampoo', 'Sulfate-free shampoo that repairs damaged hair and restores shine. Infused with keratin.', 26.99, 'Haircare', 'Silk & Shine', 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', 140, false),
('Deep Conditioning Mask', 'Intensive treatment mask for dry, damaged hair. Restores moisture and elasticity.', 34.50, 'Haircare', 'Hair Therapy', 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800', 100, false),
('Argan Oil Hair Serum', 'Lightweight serum that tames frizz and adds shine. Non-greasy formula with pure argan oil.', 29.99, 'Haircare', 'Moroccan Gold', 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', 120, true),
('Volumizing Mousse', 'Lightweight mousse that adds body and volume without weighing hair down. Long-lasting hold.', 18.50, 'Haircare', 'Volume Pro', 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800', 90, false),
('Heat Protection Spray', 'Thermal spray that protects hair from heat styling damage up to 450°F. Contains silk proteins.', 22.00, 'Haircare', 'Style Guard', 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', 150, false),
('Color Safe Conditioner', 'Nourishing conditioner for color-treated hair. Extends color vibrancy and prevents fading.', 28.99, 'Haircare', 'Color Lock', 'https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=800', 110, false);

-- Insert Fragrance Products
INSERT INTO products (name, description, price, category, brand, image_url, stock, is_featured) VALUES
('Midnight Rose Perfume', 'Elegant floral fragrance with notes of rose, jasmine, and sandalwood. Perfect for evening wear.', 78.00, 'Fragrance', 'Essence Luxe', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 70, true),
('Ocean Breeze Cologne', 'Fresh aquatic scent with citrus and marine notes. Light and refreshing for daily wear.', 65.00, 'Fragrance', 'Azure Scent', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 85, false),
('Vanilla Musk Eau de Parfum', 'Warm and sensual fragrance with vanilla, amber, and white musk. Long-lasting scent.', 82.50, 'Fragrance', 'Velvet Scents', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 60, false),
('Citrus Burst Body Spray', 'Energizing body spray with grapefruit, orange, and bergamot. Light and refreshing.', 24.99, 'Fragrance', 'Fresh Start', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 150, false),
('Lavender Dreams Perfume Oil', 'Concentrated perfume oil with calming lavender and vanilla. Roll-on application.', 32.00, 'Fragrance', 'Natural Scents', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 100, false),
('Exotic Spice Fragrance', 'Bold oriental fragrance with cardamom, cinnamon, and amber. For confident individuals.', 88.00, 'Fragrance', 'Spice Route', 'https://images.pexels.com/photos/3738386/pexels-photo-3738386.jpeg?auto=compress&cs=tinysrgb&w=800', 45, false);

-- Insert Sample Coupons
INSERT INTO coupons (code, discount_percentage, active, expires_at) VALUES
('WELCOME10', 10, true, now() + interval '30 days'),
('BEAUTY20', 20, true, now() + interval '60 days'),
('SPRING25', 25, true, now() + interval '90 days'),
('FREESHIP', 15, true, now() + interval '45 days');
