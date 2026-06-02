<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_type', 50)->default('physical')->after('status');
            $table->string('brand', 100)->nullable()->after('product_type');
            $table->string('unit', 50)->default('pc')->after('brand');
            $table->text('search_tags')->nullable()->after('unit');
            $table->integer('min_order_qty')->default(1)->after('search_tags');
            $table->decimal('discount_amount', 10, 2)->default(0.00)->after('min_order_qty');
            $table->string('discount_type', 10)->default('flat')->after('discount_amount');
            $table->decimal('shipping_cost', 10, 2)->default(0.00)->after('discount_type');
            $table->boolean('multiply_qty_shipping')->default(false)->after('shipping_cost');
            $table->json('products_thumbnail')->nullable()->after('multiply_qty_shipping');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'product_type',
                'brand',
                'unit',
                'search_tags',
                'min_order_qty',
                'discount_amount',
                'discount_type',
                'shipping_cost',
                'multiply_qty_shipping',
                'products_thumbnail'
            ]);
        });
    }
};
