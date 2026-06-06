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
        Schema::table('stores', function (Blueprint $table) {
            // true: អនុញ្ញាតឱ្យទិញដោយមិនបាច់ Login, false: បង្ខំឱ្យ Login ទើបអាចទិញបាន
            $table->boolean('guest_checkout')->default(true)->after('value');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('customer_email')->nullable()->after('customer_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn('guest_checkout');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('customer_email');
        });
    }
};
