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
        Schema::create('store_theme_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_id'); // Store owner's ID
            $table->string('theme_id', 100);       // Theme key (e.g., fashion, cafe_shop)
            $table->unsignedBigInteger('changed_by')->nullable(); // Who changed it (e.g. owner or admin)
            $table->timestamps();

            // Index for faster queries
            $table->index('owner_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_theme_history');
    }
};
