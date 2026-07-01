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
        Schema::create('store_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('slug', 100);
            $table->string('title', 255);
            $table->longText('content_json')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            // Enforce unique pages per owner (e.g. only one 'home' page per store)
            $table->unique(['owner_id', 'slug']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_pages');
    }
};
