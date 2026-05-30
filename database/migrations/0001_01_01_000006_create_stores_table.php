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
        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('store_name')->nullable();
            $table->string('store_phone', 50)->nullable();
            $table->string('store_email')->nullable();
            $table->text('store_address')->nullable();
            $table->float('tax_percentage')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('social_tiktok')->nullable();
            $table->string('social_facebook')->nullable();
            $table->string('social_telegram')->nullable();
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('updated_at')->nullable();
            $table->dateTime('deleted_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stores');
    }
};
