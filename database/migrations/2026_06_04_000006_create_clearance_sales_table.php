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
        Schema::create('clearance_sales', function (Blueprint $table) {
            $table->id();
            $table->string('title')->default('Clearance Sale');
            $table->boolean('is_active')->default(false);
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('discount_type'); // flat | product_wise
            $table->decimal('discount_amount', 10, 2)->nullable();
            $table->string('discount_amount_type')->nullable(); // flat | percent
            $table->string('offer_active_time')->default('always'); // always | specific_time
            $table->time('active_start_time')->nullable();
            $table->time('active_end_time')->nullable();
            $table->boolean('show_in_home_page')->default(false);
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->string('meta_image')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clearance_sales');
    }
};
