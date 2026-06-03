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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Core Identifiers
            $table->string('order_no')->unique(); // Removed nullable
            $table->string('order_type', 50)->default('delivery'); // Delivery, Pickup, etc.

            // Relationships
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('store_id')->nullable()->constrained('stores')->restrictOnDelete(); // Changed to restrict
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete(); // Added constraint

            // Snapshotted Customer Data (Excellent practice)
            $table->string('customer_name')->nullable();
            $table->string('customer_phone', 50)->nullable();
            $table->text('customer_address')->nullable();

            // Financials
            $table->decimal('subtotal', 10, 2)->default(0.00);
            $table->decimal('tax', 10, 2)->default(0.00);
            $table->decimal('shipping_fee', 10, 2)->default(0.00); // Added
            $table->decimal('discount_amount', 10, 2)->default(0.00); // Added
            $table->decimal('total_amount', 10, 2)->default(0.00);

            // Statuses
            $table->string('status', 50)->default('pending'); // Pending, Processing, Completed, Cancelled
            $table->string('payment_status', 50)->default('unpaid'); // Unpaid, Paid, Refunded
            $table->string('payment_method', 50)->default('cash_on_delivery');

            // Meta
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes(); // Added for financial safety
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
