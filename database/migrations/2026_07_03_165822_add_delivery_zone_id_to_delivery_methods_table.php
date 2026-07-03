<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up (): void
    {
        Schema::table('delivery_methods', function (Blueprint $table) {
            $table->foreignId('delivery_zone_id')
                ->nullable()
                ->after('created_by')
                ->constrained('delivery_zones')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down (): void
    {
        Schema::table('delivery_methods', function (Blueprint $table) {
            $table->dropForeign(['delivery_zone_id']);
            $table->dropColumn('delivery_zone_id');
        });
    }
};
