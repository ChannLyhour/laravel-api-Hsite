<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Change image columns from VARCHAR(255) to LONGTEXT to support base64
     * data URIs on serverless deployments (e.g., Vercel) where the filesystem
     * is read-only and images must be stored inline.
     */
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->longText('image')->nullable()->change();
        });

        // Also fix other tables that store images and may receive base64 data
        Schema::table('users', function (Blueprint $table) {
            $table->longText('image')->nullable()->change();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->longText('image')->nullable()->change();
        });

        if (Schema::hasColumn('flash_deals', 'image')) {
            Schema::table('flash_deals', function (Blueprint $table) {
                $table->longText('image')->nullable()->change();
            });
        }

        if (Schema::hasColumn('featured_deals', 'image')) {
            Schema::table('featured_deals', function (Blueprint $table) {
                $table->longText('image')->nullable()->change();
            });
        }

        if (Schema::hasColumn('delivery_methods', 'image')) {
            Schema::table('delivery_methods', function (Blueprint $table) {
                $table->longText('image')->nullable()->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });

        if (Schema::hasColumn('flash_deals', 'image')) {
            Schema::table('flash_deals', function (Blueprint $table) {
                $table->string('image')->nullable()->change();
            });
        }

        if (Schema::hasColumn('featured_deals', 'image')) {
            Schema::table('featured_deals', function (Blueprint $table) {
                $table->string('image')->nullable()->change();
            });
        }

        if (Schema::hasColumn('delivery_methods', 'image')) {
            Schema::table('delivery_methods', function (Blueprint $table) {
                $table->string('image')->nullable()->change();
            });
        }
    }
};
