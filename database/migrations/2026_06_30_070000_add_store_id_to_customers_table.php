<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds store_id to customers table for multi-store customer isolation.
     * - store_id references the store owner's user_id (same as created_by)
     * - Composite unique indexes on (store_id, email) and (store_id, phone)
     *   ensure the same email/phone can exist across different stores
     *   but not duplicate within the same store.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // 1. Add store_id column (nullable initially for backfill)
            $table->unsignedBigInteger('store_id')->nullable()->after('user_id');
        });

        // 2. Backfill: set store_id = created_by for all existing customers
        DB::table('customers')->whereNull('store_id')->update([
            'store_id' => DB::raw('created_by'),
        ]);

        Schema::table('customers', function (Blueprint $table) {
            // 3. Add composite unique indexes
            //    Using unique index names to avoid conflicts
            $table->unique(['store_id', 'email'], 'customers_store_id_email_unique');
            $table->unique(['store_id', 'phone'], 'customers_store_id_phone_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_store_id_email_unique');
            $table->dropUnique('customers_store_id_phone_unique');
            $table->dropColumn('store_id');
        });
    }
};
