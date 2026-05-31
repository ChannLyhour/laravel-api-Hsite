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
        Schema::table('banners', function (Blueprint $table) {
            $table->longText('image')->nullable()->change();
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->longText('logo_url')->nullable()->change();
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->longText('value')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('banners', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });

        Schema::table('stores', function (Blueprint $table) {
            $table->string('logo_url')->nullable()->change();
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->string('value')->nullable()->change();
        });
    }
};
