<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for a Sale Clothing Store.
     */
    public function run(): void
    {
        // Disable foreign key constraints
        Schema::disableForeignKeyConstraints();

        // 1. Clear existing tables
        $tables = [
            'roles',
            'users',
            'categories',
            'stores',
            'brands',
            'product_variant_attribute_values',
            'product_attribute_values',
            'product_attributes',
            'product_images',
            'product_variants',
            'product_translations',
            'products',
            'customers',
            'orders',
            'order_items',
            'payments',
            'banners',
            'likes',
            'settings',
            'coupons',
            'flash_deals',
            'flash_deal_product',
            'featured_deals',
            'featured_deal_product',
            'clearance_sales',
            'clearance_sale_product'
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        // 2. Seed Roles
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'Admin', 'slug' => 'admin', 'description' => 'System Administrator', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Customer', 'slug' => 'customer', 'description' => 'Regular Customer', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 30003, 'name' => 'Owner', 'slug' => 'owner', 'description' => 'Store Owner', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 3. Seed Users (20 users)
        $users = [
            ['id' => 1, 'name' => 'Super Admin', 'role_id' => 1, 'email' => 'admin@example.com', 'password' => bcrypt('password123'), 'state' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'Jane Smith', 'role_id' => 1, 'email' => 'jane@example.com', 'password' => bcrypt('password123'), 'state' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => 'Chann Lyhour', 'role_id' => 2, 'email' => 'lyhour@example.com', 'password' => bcrypt('password123'), 'state' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'John Doe', 'role_id' => 30003, 'email' => 'john@example.com', 'password' => bcrypt('password123'), 'state' => 'active', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'Sarah Connor', 'role_id' => 30003, 'email' => 'sarah@example.com', 'password' => bcrypt('password123'), 'state' => 'active', 'created_at' => now(), 'updated_at' => now()],
        ];

        for ($i = 6; $i <= 20; $i++) {
            $users[] = [
                'id' => $i,
                'name' => 'User ' . $i,
                'role_id' => ($i % 3 == 0) ? 30003 : 2,
                'email' => 'user' . $i . '@example.com',
                'password' => bcrypt('password123'),
                'state' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('users')->insert($users);

        // 4. Seed Categories (20 Clothing Specific Categories)
        DB::table('categories')->insert([
            ['id' => 1, 'parent_id' => null, 'name' => 'Men Fashion', 'description' => 'Clothing and accessories for men', 'status' => 1, 'is_menu' => 1, 'priority' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'parent_id' => null, 'name' => 'Women Fashion', 'description' => 'Latest trends in women clothing', 'status' => 1, 'is_menu' => 1, 'priority' => 9, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'parent_id' => null, 'name' => 'Kids & Baby', 'description' => 'Comfortable wear for children', 'status' => 1, 'is_menu' => 1, 'priority' => 8, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'parent_id' => null, 'name' => 'Activewear', 'description' => 'Gym, sports, and workout gear', 'status' => 1, 'is_menu' => 1, 'priority' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'parent_id' => null, 'name' => 'Accessories', 'description' => 'Bags, belts, and hats', 'status' => 1, 'is_menu' => 1, 'priority' => 6, 'created_at' => now(), 'updated_at' => now()],
            
            // Subcategories for Men Fashion
            ['id' => 6, 'parent_id' => 1, 'name' => 'Men T-Shirts & Polos', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 7, 'parent_id' => 1, 'name' => 'Men Shirts', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 8, 'parent_id' => 1, 'name' => 'Men Jeans & Chinos', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 9, 'parent_id' => 1, 'name' => 'Men Jackets & Hoodies', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 2, 'created_at' => now(), 'updated_at' => now()],
            
            // Subcategories for Women Fashion
            ['id' => 10, 'parent_id' => 2, 'name' => 'Dresses & Jumpsuits', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 11, 'parent_id' => 2, 'name' => 'Women Blouses & Tops', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 12, 'parent_id' => 2, 'name' => 'Skirts & Shorts', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 13, 'parent_id' => 2, 'name' => 'Women Knitwear', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 2, 'created_at' => now(), 'updated_at' => now()],
            
            // Subcategories for Kids & Activewear
            ['id' => 14, 'parent_id' => 3, 'name' => 'Boys Clothing', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 15, 'parent_id' => 3, 'name' => 'Girls Clothing', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 16, 'parent_id' => 4, 'name' => 'Sports Bras & Leggings', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 17, 'parent_id' => 4, 'name' => 'Running Shorts', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 18, 'parent_id' => 5, 'name' => 'Bags & Backpacks', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 19, 'parent_id' => 5, 'name' => 'Belts & Wallets', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 20, 'parent_id' => 5, 'name' => 'Socks & Hats', 'description' => null, 'status' => 1, 'is_menu' => 1, 'priority' => 3, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 5. Seed Apparel Brands (20 brands)
        $brandNames = [
            'Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo', 'Levi\'s', 'Gucci', 'Prada', 
            'Puma', 'Calvin Klein', 'Tommy Hilfiger', 'Gap', 'Under Armour', 'Ralph Lauren', 
            'Mango', 'Diesel', 'Forever 21', 'Asos', 'Champion', 'Supreme'
        ];
        $brands = [];
        foreach ($brandNames as $index => $name) {
            $brands[] = [
                'id' => $index + 1,
                'name' => $name,
                'status' => 1,
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('brands')->insert($brands);

        // 6. Seed Stores (Key-Value settings for each store owner)
        $storeOwners = [4, 5, 6, 9, 12, 15, 18];
        $stores = [];
        foreach ($storeOwners as $ownerId) {
            $settings = [
                'store_name' => 'Fashion Boutique Outlet ' . $ownerId,
                'store_email' => 'store' . $ownerId . '@example.com',
                'store_phone' => '0123456' . $ownerId,
                'store_address' => 'Street ' . $ownerId . ', City',
                'guest_checkout' => '1',
            ];
            foreach ($settings as $key => $value) {
                $stores[] = [
                    'created_by' => $ownerId,
                    'key' => $key,
                    'value' => $value,
                    'guest_checkout' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        DB::table('stores')->insert($stores);

        // 7. Seed Products (20 apparel items)
        $products = [];
        for ($i = 1; $i <= 20; $i++) {
            $products[] = [
                'id' => $i,
                'category_id' => rand(6, 20),
                'brand_id' => ($i % 20) + 1,
                'sku' => 'CLS-' . strtoupper(Str::random(8)),
                'status' => 'active',
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('products')->insert($products);

        // 8. Seed Clothing Product Translations
        $productNames = [
            'Classic White Crewneck T-Shirt',
            'Slim Fit Stretch Denim Jeans',
            'Oversized Linen Button-Down Shirt',
            'Vintage Leather Biker Jacket',
            'Floral Summer Midi Dress',
            'High-Waisted Yoga Leggings',
            'Water-Resistant Windbreaker Jacket',
            'Premium Cotton Polo Shirt',
            'Cozy Knit Wool Sweater',
            'Athletic Running Training Shorts',
            'Casual Cargo Pants',
            'Elegant Evening Wrap Dress',
            'Denim Trucker Jacket',
            'Graphic Streetwear Hoodie',
            'Tailored Slim Fit Blazer',
            'Pleated A-Line Mini Skirt',
            'Ribbed Knit Crop Top',
            'Kids Organic Cotton Onesie',
            'Canvas Everyday Tote Bag',
            'Adjustable Snapback Sports Cap'
        ];
        $translations = [];
        foreach ($productNames as $index => $name) {
            $translations[] = [
                'product_id' => $index + 1,
                'locale' => 'en',
                'name' => $name,
                'description' => 'Comfortable and stylish ' . $name . ' designed for premium comfort and long-lasting everyday wear.',
                'slug' => Str::slug($name),
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('product_translations')->insert($translations);

        // 9. Seed Clothing Product Variants
        $variants = [];
        for ($i = 1; $i <= 20; $i++) {
            $variants[] = [
                'id' => $i,
                'product_id' => $i,
                'variant_sku' => 'VAR-CLS-' . $i . '-' . Str::random(4),
                'retail_price' => rand(15, 250),
                'stock_qty' => rand(20, 150),
                'created_by' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('product_variants')->insert($variants);

        // 10. Seed Customers (20 customers)
        $customers = [];
        for ($i = 1; $i <= 20; $i++) {
            $customers[] = [
                'id' => $i,
                'user_id' => ($i <= 15) ? $i + 5 : null,
                'name' => 'Fashionista Customer ' . $i,
                'email' => 'customer' . $i . '@example.com',
                'phone' => '09876543' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('customers')->insert($customers);

        // 11. Seed Orders (20 orders)
        $orders = [];
        for ($i = 1; $i <= 20; $i++) {
            $amount = rand(30, 450);
            $orders[] = [
                'id' => $i,
                'order_no' => 'FSH-' . strtoupper(Str::random(6)),
                'user_id' => rand(3, 20),
                'status' => 'completed',
                'total_amount' => $amount,
                'payment_status' => 'Paid',
                'payment_method' => ($i % 2 == 0) ? 'Credit Card' : 'Cash on Delivery',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('orders')->insert($orders);

        // 12. Seed Order Items
        $orderItems = [];
        for ($i = 1; $i <= 20; $i++) {
            $orderItems[] = [
                'order_id' => $i,
                'product_variant_id' => rand(1, 20),
                'name' => 'Clothing Item ' . $i,
                'quantity' => rand(1, 4),
                'price' => rand(15, 120),
            ];
        }
        DB::table('order_items')->insert($orderItems);

        // 13. Seed Payments
        $payments = [];
        for ($i = 1; $i <= 20; $i++) {
            $totalAmount = rand(30, 450);
            $payments[] = [
                'order_id' => $i,
                'payment_method' => ($i % 2 == 0) ? 'card' : 'cash',
                'total_amount' => $totalAmount,
                'paid_amount' => $totalAmount,
                'change_amount' => 0.00,
                'status' => 'paid',
                'paid_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('payments')->insert($payments);

        // 14. Seed Sale Banners (10 Fashion Promo Banners)
        $banners = [];
        $promoTitles = [
            'End of Season Sale - Up to 50% Off',
            'Summer Collection Now Live',
            'Buy 1 Get 1 Free on Denim',
            'Winter Clearance Extravaganza',
            'Essentials Wardrobe: Min. 30% Off',
            'New Streetwear Drops',
            'Exclusive Activewear Promotion',
            'Boutique Weekend Flash Sale',
            'Join Our Fashion Club - 10% First Order',
            'Back to School Kids Outfits'
        ];
        
        for ($i = 1; $i <= 10; $i++) {
            $banners[] = [
                'id' => $i,
                'title' => $promoTitles[$i - 1],
                'description' => 'Exclusive limited time offer on our latest fashion collection. Shop now and save big!',
                'image' => 'banners/fashion_promo_' . $i . '.jpg',
                'is_active' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('banners')->insert($banners);

        // Synchronize thumbnails
        $products = \App\Models\Product::all();
        foreach ($products as $product) {
            $product->syncThumbnails();
        }

        // Seed templates
        $this->call(TemplateSeeder::class);

        // Re-enable foreign key constraints
        Schema::enableForeignKeyConstraints();
    }
}