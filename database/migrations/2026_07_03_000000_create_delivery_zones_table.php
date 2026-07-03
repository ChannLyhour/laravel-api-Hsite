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
        Schema::create('delivery_zones', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code');
            $table->text('description')->nullable();
            $table->string('type')->default('radius'); // 'radius' or 'polygon'
            $table->decimal('center_lat', 10, 8)->nullable();
            $table->decimal('center_lng', 11, 8)->nullable();
            $table->decimal('radius_km', 5, 2)->nullable();
            $table->geometry('polygon_coordinates')->nullable(); // For spatial data if needed
            $table->decimal('delivery_fee', 10, 2)->default(0.00);
            $table->string('estimated_delivery_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_zones');
    }
};
