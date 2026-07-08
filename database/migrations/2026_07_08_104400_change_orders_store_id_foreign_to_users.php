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
        Schema::table('orders', function (Blueprint $table) {
            // Drop existing foreign key pointing to stores
            try {
                $table->dropForeign('orders_store_id_foreign');
            } catch (\Exception $e) {
                // Ignore if it doesn't exist or is not a foreign key
            }

            // Create new foreign key pointing to users (owner's user ID)
            $table->foreign('store_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropForeign(['store_id']);
            } catch (\Exception $e) {
                // Ignore
            }

            $table->foreign('store_id')
                ->references('id')
                ->on('stores')
                ->restrictOnDelete();
        });
    }
};
