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
        Schema::create('featured_deal_product', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('featured_deal_id');
            $table->unsignedBigInteger('product_id');
            $table->timestamps();

            $table->foreign('featured_deal_id')->references('id')->on('featured_deals')->cascadeOnDelete();
            $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            $table->unique(['featured_deal_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('featured_deal_product');
    }
};
