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
        Schema::table('brands', function (Blueprint $table) {
            $table->string('alt_text')->nullable()->after('logo');
            $table->integer('total_product')->default(0)->after('alt_text');
            $table->integer('total_order')->default(0)->after('total_product');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table) {
            $table->dropColumn(['alt_text', 'total_product', 'total_order']);
        });
    }
};
