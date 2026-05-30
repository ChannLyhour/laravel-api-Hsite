<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key constraints to prevent ordering issues
        Schema::disableForeignKeyConstraints();

        // 1. Clear existing tables
        DB::table('roles')->truncate();
        DB::table('users')->truncate();
        DB::table('categories')->truncate();
        DB::table('stores')->truncate();
        DB::table('menu_items')->truncate();
        DB::table('customers')->truncate();
        DB::table('orders')->truncate();
        DB::table('order_items')->truncate();
        DB::table('payments')->truncate();
        DB::table('banners')->truncate();
        DB::table('likes')->truncate();
        DB::table('settings')->truncate();

        // 2. Seed Roles
        DB::table('roles')->insert([
            ['id' => 1, 'name' => 'Admin', 'slug' => 'admin', 'description' => null, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-24 11:20:05'],
            ['id' => 2, 'name' => 'Customer', 'slug' => 'customer', 'description' => null, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-24 11:20:05'],
            ['id' => 30003, 'name' => 'Owner', 'slug' => 'owner', 'description' => null, 'created_at' => null, 'updated_at' => null],
        ]);

        // 3. Seed Users
        DB::table('users')->insert([
            [
                'id' => 1,
                'name' => 'Super Admin',
                'role_id' => 30003,
                'phone' => null,
                'email' => 'admin@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => 'users/1779600384_photo_2026-05-21_22-30-32.jpg',
                'email_verified_at' => null,
                'password' => '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa', // password123
                'remember_token' => 'ZXS2KVeKCd3mbgovMK3C08uvylMn9LCpOhTHoJUUMzljqkuylaeBheApjWjS',
                'created_at' => '2026-05-24 11:20:05',
                'updated_at' => '2026-05-24 12:26:24',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 2,
                'name' => 'Jane Smith',
                'role_id' => 1,
                'phone' => null,
                'email' => 'customer@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => 'users/1779773100_download.png',
                'email_verified_at' => null,
                'password' => '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa',
                'remember_token' => null,
                'created_at' => '2026-05-24 11:20:05',
                'updated_at' => '2026-05-26 12:25:00',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 3,
                'name' => 'Chann Lyhour',
                'role_id' => 2,
                'phone' => null,
                'email' => 'ChannLyhour@gmail.com',
                'address' => '',
                'city' => '',
                'state' => 'active',
                'image' => 'users/1779597775_668598681_1402866021867146_1795824876399772923_n.jpg',
                'email_verified_at' => null,
                'password' => '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa',
                'remember_token' => null,
                'created_at' => '2026-05-24 11:42:31',
                'updated_at' => '2026-05-24 11:42:55',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 6,
                'name' => 'Test',
                'role_id' => 30003,
                'phone' => null,
                'email' => 'test@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => null,
                'email_verified_at' => null,
                'password' => '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa',
                'remember_token' => null,
                'created_at' => '2026-05-24 15:25:44',
                'updated_at' => '2026-05-24 15:25:44',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 7,
                'name' => 'Hiii',
                'role_id' => 2,
                'phone' => null,
                'email' => 'G1@gmail.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => null,
                'email_verified_at' => null,
                'password' => '$2y$12$0aPX6uLdfFn13gXSm2fUD.btdc2seBZzBIO7.sV8Ki99bULzS3fKG',
                'remember_token' => null,
                'created_at' => '2026-05-24 15:55:46',
                'updated_at' => '2026-05-24 15:55:46',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 8,
                'name' => 'Bro hour',
                'role_id' => 2,
                'phone' => null,
                'email' => 'info@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => 'users/1779620938_favicon.png',
                'email_verified_at' => null,
                'password' => '$2y$12$ubsYQEUZMDsM2EmTeh3dt.6POPnHatL7IgH6myKK7mnE93jj0x7R6',
                'remember_token' => null,
                'created_at' => '2026-05-24 17:58:50',
                'updated_at' => '2026-05-24 18:08:58',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 9,
                'name' => 'Testing',
                'role_id' => 30003,
                'phone' => '093778374',
                'email' => 'customer11@example.com',
                'address' => 'SR',
                'city' => 'SR',
                'state' => 'active',
                'image' => null,
                'email_verified_at' => null,
                'password' => '$2y$12$a8bISyamdJ7bjl4I.pApPuH1Dm/dBsSs8jpI/cfxYfkZXgpqC9mqS',
                'remember_token' => null,
                'created_at' => '2026-05-26 12:43:05',
                'updated_at' => '2026-05-26 12:43:05',
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 30016,
                'name' => 'Test Customer',
                'role_id' => 2,
                'phone' => null,
                'email' => 'test_customer@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => null,
                'email_verified_at' => null,
                'password' => 'hashedpassword',
                'remember_token' => null,
                'created_at' => null,
                'updated_at' => null,
                'created_by' => null,
                'deleted_at' => null
            ],
            [
                'id' => 30017,
                'name' => 'Test Owner',
                'role_id' => 30003,
                'phone' => null,
                'email' => 'test_owner@example.com',
                'address' => null,
                'city' => null,
                'state' => 'active',
                'image' => null,
                'email_verified_at' => null,
                'password' => '$2b$12$pGovvNCcemOlJbEfQqOrOOkvtMUdagOWtyY469Zv7SLtY.xsYEQXa',
                'remember_token' => null,
                'created_at' => null,
                'updated_at' => null,
                'created_by' => null,
                'deleted_at' => null
            ]
        ]);

        // 4. Seed Categories
        DB::table('categories')->insert([
            ['id' => 2, 'name' => 'Testing233111', 'description' => 'Tesing232311', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-29 08:42:33', 'created_by' => 1],
            ['id' => 3, 'name' => 'Rice & Noodles', 'description' => 'Traditional rice and noodle dishes', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-26 13:55:04', 'created_by' => 1],
            ['id' => 4, 'name' => 'Soups', 'description' => 'Warm and comforting soups', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-26 13:55:06', 'created_by' => 1],
            ['id' => 5, 'name' => 'Salads', 'description' => 'Fresh and healthy salad options', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-26 13:55:06', 'created_by' => 1],
            ['id' => 6, 'name' => 'Grilled Specialties', 'description' => 'Delicious grilled meats and seafood', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-26 13:55:07', 'created_by' => 1],
            ['id' => 7, 'name' => 'Seafood', 'description' => 'Fresh catch of the day', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-26 13:55:03', 'created_by' => 1],
            ['id' => 8, 'name' => 'Vegetarian', 'description' => 'Plant-based delicious options', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-24 11:20:05', 'created_by' => 1],
            ['id' => 9, 'name' => 'Desserts', 'description' => 'Sweet treats to end your meal', 'status' => 1, 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-24 11:20:05', 'created_by' => 1],
            ['id' => 30014, 'name' => 'Testing', 'description' => 'Tesing', 'status' => 1, 'created_at' => '2026-05-29 06:30:10', 'updated_at' => '2026-05-29 06:30:10', 'created_by' => 2],
            ['id' => 30015, 'name' => 'Testing1', 'description' => 'Tesing', 'status' => 1, 'created_at' => '2026-05-29 06:32:45', 'updated_at' => '2026-05-29 16:31:12', 'created_by' => 2],
            ['id' => 2060013, 'name' => 'Houuus', 'description' => 'sjdnsjf', 'status' => 1, 'created_at' => '2026-05-29 14:00:20', 'updated_at' => '2026-05-29 14:00:20', 'created_by' => 1],
            ['id' => 2090013, 'name' => 'Soup Khmer', 'description' => null, 'status' => 1, 'created_at' => '2026-05-29 15:45:45', 'updated_at' => '2026-05-29 15:45:45', 'created_by' => 6],
            ['id' => 2090014, 'name' => 'Chivorn', 'description' => 'Hhhd', 'status' => 1, 'created_at' => '2026-05-29 15:54:25', 'updated_at' => '2026-05-29 15:54:25', 'created_by' => 6],
            ['id' => 2120013, 'name' => 'Pizza', 'description' => null, 'status' => 1, 'created_at' => '2026-05-30 03:21:09', 'updated_at' => '2026-05-30 03:21:09', 'created_by' => 9],
        ]);

        // 5. Seed Stores
        DB::table('stores')->insert([
            [
                'id' => 1,
                'created_by' => 1,
                'store_name' => 'Food Ordering System',
                'store_phone' => '09876543',
                'store_email' => 'brohour00044@gmail.com',
                'store_address' => 'Siem Reap',
                'tax_percentage' => 0.01,
                'subscription_tier' => 'premium',
                'custom_domain' => 'foodsystem.com',
                'logo_url' => '',
                'social_tiktok' => 'https://www.tiktok.com/@fujinstatic',
                'social_facebook' => 'https://web.facebook.com/bro.hour.1422409',
                'social_telegram' => 'https://t.me/LHor2005',
                'created_at' => '2026-05-30 03:02:45',
                'updated_at' => '2026-05-30 03:06:48',
                'deleted_at' => null
            ],
            [
                'id' => 2,
                'created_by' => 2,
                'store_name' => 'Lyhour Store Kh',
                'store_phone' => '068642521',
                'store_email' => 'Hour@gmail.com',
                'store_address' => 'Siem Reap',
                'tax_percentage' => 1.0,
                'subscription_tier' => 'standard',
                'custom_domain' => null,
                'logo_url' => '',
                'social_tiktok' => 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc',
                'social_facebook' => 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc',
                'social_telegram' => 'https://www.tiktok.com/@raaaaaaaaaa715/video/7642162216027852053?is_from_webapp=1&sender_device=pc',
                'created_at' => '2026-05-30 03:06:48',
                'updated_at' => '2026-05-30 07:09:52',
                'deleted_at' => null
            ],
            [
                'id' => 3,
                'created_by' => 6,
                'store_name' => 'Chivorn Store kh',
                'store_phone' => '---',
                'store_email' => '---',
                'store_address' => '---',
                'tax_percentage' => 0.0,
                'subscription_tier' => 'premium',
                'custom_domain' => 'chivornstore.com',
                'logo_url' => '',
                'social_tiktok' => '#',
                'social_facebook' => '#',
                'social_telegram' => '#',
                'created_at' => '2026-05-30 03:06:48',
                'updated_at' => '2026-05-30 03:06:48',
                'deleted_at' => null
            ],
            [
                'id' => 4,
                'created_by' => 9,
                'store_name' => 'TiTong Store KH',
                'store_phone' => '082838233',
                'store_email' => 'Tong@gmail.com',
                'store_address' => 'Siem Reap',
                'tax_percentage' => 0.0,
                'subscription_tier' => 'free',
                'custom_domain' => null,
                'logo_url' => '',
                'social_tiktok' => '#',
                'social_facebook' => '#',
                'social_telegram' => '#',
                'created_at' => '2026-05-30 03:06:48',
                'updated_at' => '2026-05-30 03:08:20',
                'deleted_at' => null
            ],
            [
                'id' => 30004,
                'created_by' => 30017,
                'store_name' => 'Integration Test Cafe',
                'store_phone' => '012345678',
                'store_email' => 'testcafe@example.com',
                'store_address' => null,
                'tax_percentage' => 10.0,
                'subscription_tier' => 'free',
                'custom_domain' => null,
                'logo_url' => null,
                'social_tiktok' => null,
                'social_facebook' => null,
                'social_telegram' => null,
                'created_at' => '2026-05-30 07:40:13',
                'updated_at' => null,
                'deleted_at' => null
            ]
        ]);

        // 6. Seed MenuItems
        DB::table('menu_items')->insert([
            ['id' => 11, 'category_id' => 2, 'name' => 'Hour Steak', 'description' => 'Premium beef steak with choice of sides', 'price' => 24.99, 'image' => 'menu-items/1780127684_favicon-removebg-preview.png', 'status' => 'unavailable', 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-30 07:55:13', 'created_by' => 1],
            ['id' => 93, 'category_id' => 30015, 'name' => 'Lemonade', 'description' => 'Homemade fresh lemonade', 'price' => 3.99, 'image' => 'menu-items/1780118700_619ufv8EySL.jpg', 'status' => 'available', 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-30 06:38:39', 'created_by' => 2],
            ['id' => 94, 'category_id' => 30015, 'name' => 'Milkshake', 'description' => 'Vanilla, chocolate, or strawberry', 'price' => 5.99, 'image' => 'menu-items/1780072255_download.png', 'status' => 'unavailable', 'created_at' => '2026-05-24 11:20:05', 'updated_at' => '2026-05-30 06:36:00', 'created_by' => 2],
            ['id' => 90102, 'category_id' => 30015, 'name' => 'Amok', 'description' => 'kdfmdfkdnvkdnv', 'price' => 9.00, 'image' => 'menu-items/1780072290_photo_2026-05-21_22-32-24.jpg', 'status' => 'available', 'created_at' => '2026-05-29 09:37:57', 'updated_at' => '2026-05-29 16:31:31', 'created_by' => 2],
            ['id' => 120103, 'category_id' => 2090013, 'name' => 'Soup chicken', 'description' => 'sdnjbsdjksbkchb', 'price' => 9.00, 'image' => 'menu-items/1780072442_IMG_4459.JPG', 'status' => 'available', 'created_at' => '2026-05-29 15:46:12', 'updated_at' => '2026-05-29 16:34:02', 'created_by' => 6],
            ['id' => 120104, 'category_id' => 2090014, 'name' => 'Lok Lak', 'description' => 'jnsbjjbs', 'price' => 9.00, 'image' => 'menu-items/1780072449_IMG_4461.JPG', 'status' => 'available', 'created_at' => '2026-05-29 15:56:48', 'updated_at' => '2026-05-29 16:34:10', 'created_by' => 6],
            ['id' => 150102, 'category_id' => 2120013, 'name' => 'Pizza Cambodai', 'description' => null, 'price' => 9.00, 'image' => 'menu-items/1780129103_download (2).jpg', 'status' => 'available', 'created_at' => '2026-05-30 03:21:41', 'updated_at' => '2026-05-30 08:18:23', 'created_by' => 9],
            ['id' => 180102, 'category_id' => 30014, 'name' => 'qqw', 'description' => 'dsdsdsd', 'price' => 3.00, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'status' => 'available', 'created_at' => '2026-05-30 05:59:54', 'updated_at' => '2026-05-30 05:59:54', 'created_by' => 2],
            ['id' => 180103, 'category_id' => 30014, 'name' => 'sdsdsdsd', 'description' => 'sdsdsd', 'price' => 1.00, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'status' => 'available', 'created_at' => '2026-05-30 06:00:05', 'updated_at' => '2026-05-30 06:00:05', 'created_by' => 2],
            ['id' => 180104, 'category_id' => 30014, 'name' => 'sdsdsd', 'description' => 'sdsdsdsd', 'price' => 2.00, 'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', 'status' => 'available', 'created_at' => '2026-05-30 06:00:37', 'updated_at' => '2026-05-30 06:00:37', 'created_by' => 2],
            ['id' => 210108, 'category_id' => null, 'name' => 'Burger Special', 'description' => null, 'price' => 12.50, 'image' => null, 'status' => 'available', 'created_at' => null, 'updated_at' => null, 'created_by' => 30017],
            ['id' => 210109, 'category_id' => null, 'name' => 'Chilled Iced Latte', 'description' => null, 'price' => 4.00, 'image' => null, 'status' => 'available', 'created_at' => null, 'updated_at' => null, 'created_by' => 30017],
        ]);

        // 7. Seed Customers
        DB::table('customers')->insert([
            ['id' => 1, 'user_id' => 3, 'name' => 'Chann Lyhour', 'email' => 'ChannLyhour@gmail.com', 'phone' => '08188182121', 'address' => '301 Siem Reap, Cambodia', 'city' => 'Siem Reap', 'created_at' => '2026-05-24 11:42:31', 'updated_at' => '2026-05-24 11:49:38', 'created_by' => null, 'deleted_at' => null],
            ['id' => 4, 'user_id' => 2, 'name' => 'Jane Smith', 'email' => 'customer@example.com', 'phone' => null, 'address' => null, 'city' => null, 'created_at' => '2026-05-26 12:25:14', 'updated_at' => '2026-05-26 12:25:14', 'created_by' => null, 'deleted_at' => null],
            ['id' => 5, 'user_id' => 9, 'name' => 'Testing', 'email' => 'customer11@example.com', 'phone' => '093778374', 'address' => 'SR', 'city' => 'SR', 'created_at' => '2026-05-26 12:43:05', 'updated_at' => '2026-05-26 12:43:05', 'created_by' => null, 'deleted_at' => null],
            ['id' => 30006, 'user_id' => 30016, 'name' => 'John Doe', 'email' => null, 'phone' => '+855 99 999 999', 'address' => 'Phnom Penh Resident St. 99', 'city' => null, 'created_at' => '2026-05-30 07:40:13', 'updated_at' => '2026-05-30 07:40:13', 'created_by' => 30016, 'deleted_at' => null],
        ]);

        // 8. Seed Orders
        DB::table('orders')->insert([
            [
                'id' => 1,
                'order_no' => 'ORD-DLFEH3',
                'order_type' => 'dine_in',
                'customer_id' => null,
                'user_id' => 1,
                'notes' => null,
                'status' => 'completed',
                'subtotal' => 47.95,
                'tax' => 4.80,
                'total_amount' => 52.75,
                'deleted_at' => null,
                'created_at' => '2026-05-24 11:26:12',
                'updated_at' => '2026-05-24 11:26:12',
                'created_by' => null,
                'store_id' => null,
                'payment_status' => 'Unpaid',
                'payment_method' => 'Cash on Delivery',
                'customer_name' => null,
                'customer_phone' => null,
                'customer_address' => null
            ],
            [
                'id' => 2,
                'order_no' => 'ORD-31YD6B',
                'order_type' => 'delivery',
                'customer_id' => 1,
                'user_id' => 3,
                'notes' => 'hhh',
                'status' => 'completed',
                'subtotal' => 4.99,
                'tax' => 0.50,
                'total_amount' => 5.49,
                'deleted_at' => null,
                'created_at' => '2026-05-24 11:49:38',
                'updated_at' => '2026-05-24 12:06:32',
                'created_by' => null,
                'store_id' => null,
                'payment_status' => 'Unpaid',
                'payment_method' => 'Cash on Delivery',
                'customer_name' => null,
                'customer_phone' => null,
                'customer_address' => null
            ],
            [
                'id' => 5,
                'order_no' => 'ORD-HOVOBY',
                'order_type' => 'delivery',
                'customer_id' => 1,
                'user_id' => 3,
                'notes' => null,
                'status' => 'pending',
                'subtotal' => 4.99,
                'tax' => 0.00,
                'total_amount' => 4.99,
                'deleted_at' => null,
                'created_at' => '2026-05-24 12:51:59',
                'updated_at' => '2026-05-24 12:51:59',
                'created_by' => null,
                'store_id' => null,
                'payment_status' => 'Unpaid',
                'payment_method' => 'Cash on Delivery',
                'customer_name' => null,
                'customer_phone' => null,
                'customer_address' => null
            ],
            [
                'id' => 30007,
                'order_no' => null,
                'order_type' => 'dine_in',
                'customer_id' => 30006,
                'user_id' => 30016,
                'notes' => 'Extra cheese on burger',
                'status' => 'complete',
                'subtotal' => 0.00,
                'tax' => 3.70,
                'total_amount' => 40.70,
                'deleted_at' => null,
                'created_at' => '2026-05-30 07:40:14',
                'updated_at' => '2026-05-30 07:40:15',
                'created_by' => null,
                'store_id' => 30004,
                'payment_status' => 'Paid',
                'payment_method' => 'Cash on Delivery',
                'customer_name' => 'John Doe',
                'customer_phone' => '+855 99 999 999',
                'customer_address' => 'Phnom Penh Resident St. 99'
            ]
        ]);

        // 9. Seed OrderItems
        DB::table('order_items')->insert([
            ['id' => 1, 'order_id' => 30007, 'menu_item_id' => 210108, 'name' => 'Burger Special', 'quantity' => 2, 'price' => 12.50],
            ['id' => 2, 'order_id' => 30007, 'menu_item_id' => 210109, 'name' => 'Chilled Iced Latte', 'quantity' => 3, 'price' => 4.00],
        ]);

        // 10. Seed Payments
        DB::table('payments')->insert([
            [
                'id' => 1,
                'order_id' => 1,
                'payment_method' => 'cash',
                'total_amount' => 52.75,
                'paid_amount' => 60.00,
                'change_amount' => 7.26,
                'status' => 'paid',
                'khqr_md5' => null,
                'khqr_string' => null,
                'khqr_transaction_id' => null,
                'khqr_expires_at' => null,
                'paid_at' => '2026-05-24 11:26:12',
                'created_at' => '2026-05-24 11:26:12',
                'updated_at' => '2026-05-24 11:26:12',
                'created_by' => null
            ],
            [
                'id' => 2,
                'order_id' => 2,
                'payment_method' => 'khqr',
                'total_amount' => 5.49,
                'paid_amount' => 5.49,
                'change_amount' => 0.00,
                'status' => 'paid',
                'khqr_md5' => null,
                'khqr_string' => '00020101021129180006bakong0100020052045812530384054045.495802KH5910Restaurant6010Phnom Penh62140110ORD-31YD6B63043ED8',
                'khqr_transaction_id' => null,
                'khqr_expires_at' => '2026-05-24 12:04:48',
                'paid_at' => '2026-05-24 12:06:32',
                'created_at' => '2026-05-24 11:49:48',
                'updated_at' => '2026-05-24 12:06:32',
                'created_by' => null
            ],
            [
                'id' => 3,
                'order_id' => 5,
                'payment_method' => 'cash',
                'total_amount' => 4.99,
                'paid_amount' => 0.00,
                'change_amount' => 0.00,
                'status' => 'paid',
                'khqr_md5' => null,
                'khqr_string' => null,
                'khqr_transaction_id' => null,
                'khqr_expires_at' => null,
                'paid_at' => null,
                'created_at' => '2026-05-24 12:51:59',
                'updated_at' => '2026-05-24 17:19:50',
                'created_by' => null
            ]
        ]);

        // 11. Seed Banners
        DB::table('banners')->insert([
            ['id' => 1, 'image' => 'banners/1779596966_6034595.jpg', 'title' => 'The Best Food ❤️', 'is_active' => 1, 'created_at' => '2026-05-24 11:29:26', 'updated_at' => '2026-05-24 11:29:39', 'created_by' => null],
        ]);

        // 12. Seed Likes
        DB::table('likes')->insert([
            ['id' => 1, 'user_id' => 3, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 99, 'created_at' => '2026-05-24 12:46:13', 'updated_at' => '2026-05-24 12:46:13', 'created_by' => null],
            ['id' => 2, 'user_id' => 3, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 98, 'created_at' => '2026-05-24 12:46:16', 'updated_at' => '2026-05-24 12:46:16', 'created_by' => null],
            ['id' => 3, 'user_id' => 3, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 3, 'created_at' => '2026-05-24 12:46:17', 'updated_at' => '2026-05-24 12:46:17', 'created_by' => null],
            ['id' => 9, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 4, 'created_at' => '2026-05-24 18:10:05', 'updated_at' => '2026-05-24 18:10:05', 'created_by' => null],
            ['id' => 10, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 5, 'created_at' => '2026-05-24 18:10:06', 'updated_at' => '2026-05-24 18:10:06', 'created_by' => null],
            ['id' => 14, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 6, 'created_at' => '2026-05-24 18:10:10', 'updated_at' => '2026-05-24 18:10:10', 'created_by' => null],
            ['id' => 15, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 3, 'created_at' => '2026-05-24 18:11:34', 'updated_at' => '2026-05-24 18:11:34', 'created_by' => null],
            ['id' => 18, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 8, 'created_at' => '2026-05-24 18:12:36', 'updated_at' => '2026-05-24 18:12:36', 'created_by' => null],
            ['id' => 19, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 95, 'created_at' => '2026-05-24 18:12:41', 'updated_at' => '2026-05-24 18:12:41', 'created_by' => null],
            ['id' => 20, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 93, 'created_at' => '2026-05-24 18:12:42', 'updated_at' => '2026-05-24 18:12:42', 'created_by' => null],
            ['id' => 22, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 7, 'created_at' => '2026-05-24 18:14:22', 'updated_at' => '2026-05-24 18:14:22', 'created_by' => null],
            ['id' => 28, 'user_id' => 8, 'likeable_type' => 'App\\Models\\MenuItem', 'likeable_id' => 99, 'created_at' => '2026-05-24 18:15:02', 'updated_at' => '2026-05-24 18:15:02', 'created_by' => null],
        ]);

        // 13. Seed Settings
        DB::table('settings')->insert([
            ['id' => 5, 'key' => 'logo', 'value' => 'settings/1779684821_photo_2026-05-21_22-32-24.jpg', 'created_at' => '2026-05-24 11:35:03', 'updated_at' => '2026-05-25 11:53:41', 'created_by' => 1],
            ['id' => 6, 'key' => 'favicon', 'value' => 'settings/1779684821_photo_2026-05-21_22-32-24.jpg', 'created_at' => '2026-05-24 11:35:03', 'updated_at' => '2026-05-25 11:53:41', 'created_by' => 1],
            ['id' => 8, 'key' => 'weekday_hours', 'value' => 'Mon-Fri: 10am - 9pm', 'created_at' => '2026-05-24 16:29:48', 'updated_at' => '2026-05-24 16:29:48', 'created_by' => 1],
            ['id' => 9, 'key' => 'weekend_hours', 'value' => 'Sat-Sun: 11am - 11pm', 'created_at' => '2026-05-24 16:29:48', 'updated_at' => '2026-05-24 16:29:48', 'created_by' => 1],
            ['id' => 10, 'key' => 'footer_description', 'value' => 'Fine food, delivered with care. From our kitchen to your door.', 'created_at' => '2026-05-25 11:53:41', 'updated_at' => '2026-05-25 11:53:41', 'created_by' => 1],
            ['id' => 11, 'key' => 'footer_copyright', 'value' => '© 2026 Food Ordering System. All rights reserved.', 'created_at' => '2026-05-25 11:53:41', 'updated_at' => '2026-05-25 11:53:41', 'created_by' => 1],
            ['id' => 90024, 'key' => 'site_maintenance_mode', 'value' => 'false', 'created_at' => null, 'updated_at' => null, 'created_by' => 1],
        ]);

        // Re-enable foreign key constraints
        Schema::enableForeignKeyConstraints();
    }
}
