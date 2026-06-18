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
        Schema::table('flash_deals', function (Blueprint $table) {
            $table->integer('priority')->default(0)->after('is_published');
        });
        Schema::table('featured_deals', function (Blueprint $table) {
            $table->integer('priority')->default(0)->after('is_published');
        });
        Schema::table('clearance_sales', function (Blueprint $table) {
            $table->integer('priority')->default(0)->after('show_in_home_page');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flash_deals', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
        Schema::table('featured_deals', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
        Schema::table('clearance_sales', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};
