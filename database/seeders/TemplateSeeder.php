<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // Premium Theme Templates
            [
                'tpl_code' => 'TPLCAFE1',
                'title' => 'Cafe Shop – Premium Culinary Theme',
                'description' => 'A beautifully designed template tailored for cafes, bistros, bakeries, and fine dining establishments. Clean, elegant, and interactive.',
                'price' => 79.00,
                'file_path' => 'templates/cafe_shop.zip',
                'theme_key' => 'cafe_shop',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tpl_code' => 'TPLELEC2',
                'title' => 'Electronic – Gadgets & Widescreen Store',
                'description' => 'Perfect theme for high-tech shops, smart devices, appliance outlets, and electronics cataloging. Optimized for wide grids.',
                'price' => 89.00,
                'file_path' => 'templates/electronic.zip',
                'theme_key' => 'electronic',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tpl_code' => 'TPLFASH3',
                'title' => 'Fashion & Style Boutique Theme',
                'description' => 'Elegant, chic aesthetic designed for apparel boutiques, clothing lines, and styling houses. Dynamic catalogs and full screens.',
                'price' => 99.00,
                'file_path' => 'templates/fashion.zip',
                'theme_key' => 'fashion',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tpl_code' => 'TPLGOLD4',
                'title' => 'Minimal Dark Gold – Luxury Theme',
                'description' => 'Deep dark palette accented with gold details. Ideal for jewelry, premium products, designer pieces, and luxury boutiques.',
                'price' => 69.00,
                'file_path' => 'templates/minimal_dark_gold.zip',
                'theme_key' => 'minimal_dark_gold',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Premium Mobile App Templates
            [
                'tpl_code' => 'TPLMOBA5',
                'title' => 'eMarket – Premium Mobile Store',
                'description' => 'Full-featured mobile e-commerce experience with bottom tabs, home, wishlist, cart, variant selectors, and product detail screens. Responsive across phone & tablet.',
                'price' => 79.00,
                'file_path' => 'templates/smartphone_emarket.zip',
                'theme_key' => 'smartphone_emarket',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tpl_code' => 'TPLMOBB6',
                'title' => 'Foodie – Gourmet Delivery App',
                'description' => 'Immersive food delivery mobile template with flash sale banners, category browsing, cart calculations, order confirmations, and responsive bottom tabs.',
                'price' => 69.00,
                'file_path' => 'templates/smartphone_foodie.zip',
                'theme_key' => 'smartphone_foodie',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tpl_code' => 'TPLMOBC7',
                'title' => 'Luxe – Fashion Boutique App',
                'description' => 'Elegant editorial fashion mobile catalog with variant selectors, wishlist management, cart discounts, and smooth layout transitions.',
                'price' => 89.00,
                'file_path' => 'templates/smartphone_luxe.zip',
                'theme_key' => 'smartphone_luxe',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($templates as $tpl) {
            DB::table('templates')->updateOrInsert(
                ['tpl_code' => $tpl['tpl_code']],
                $tpl
            );
        }
    }
}
