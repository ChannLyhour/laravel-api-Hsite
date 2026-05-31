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
        // 1. TABLE: products (The Core Identity)
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('sku', 100)->unique();
            $table->string('barcode', 50)->nullable()->index();
            $table->enum('status', ['active', 'draft', 'archived'])->default('active');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });

        // 2. TABLE: product_translations (The Multilingual Layer)
        Schema::create('product_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('locale', 5);
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('slug', 255);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->unique(['product_id', 'locale']);
        });

        // 3. TABLE: product_variants (The Commercial Storefront Layer)
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->string('variant_sku', 100)->unique();
            $table->string('region_code', 3)->default('GLO');
            $table->string('currency_code', 3)->default('USD');
            $table->decimal('purchase_price', 12, 2)->default(0.00);
            $table->decimal('retail_price', 12, 2)->default(0.00);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->integer('stock_qty')->default(0);
            $table->integer('low_stock_threshold')->default(5);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->unique(['product_id', 'region_code', 'variant_sku']);
        });

        // 4. TABLE: product_images (Media Management)
        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('product_variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->string('image_path', 2048);
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('created_at')->useCurrent();
        });

        // 5. TABLE: product_attributes (Flexible Attribute Definitions)
        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['name', 'created_by']);
        });

        // 6. TABLE: product_attribute_values (Specific Value Scopes)
        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_attribute_id')->constrained('product_attributes')->cascadeOnDelete();
            $table->string('value', 255);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['product_attribute_id', 'value']);
        });

        // 7. TABLE: product_variant_attribute_values (Mapping Registry)
        Schema::create('product_variant_attribute_values', function (Blueprint $table) {
            $table->unsignedBigInteger('product_variant_id');
            $table->unsignedBigInteger('product_attribute_value_id');

            $table->foreign('product_variant_id', 'fk_pv_attr_variant')
                ->references('id')->on('product_variants')->cascadeOnDelete();

            $table->foreign('product_attribute_value_id', 'fk_pv_attr_value')
                ->references('id')->on('product_attribute_values')->onDelete('restrict');

            $table->primary(['product_variant_id', 'product_attribute_value_id'], 'pv_pav_primary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_attribute_values');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_attributes');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_translations');
        Schema::dropIfExists('products');
    }
};
