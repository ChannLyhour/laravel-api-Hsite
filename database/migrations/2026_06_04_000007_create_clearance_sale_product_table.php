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
        Schema::create('clearance_sale_product', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('clearance_sale_id');
            $table->unsignedBigInteger('product_id');
            $table->decimal('discount_amount', 10, 2)->default(0.00);
            $table->string('discount_type')->default('flat'); // flat | percent
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('clearance_sale_id')->references('id')->on('clearance_sales')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->unique(['clearance_sale_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clearance_sale_product');
    }
};
