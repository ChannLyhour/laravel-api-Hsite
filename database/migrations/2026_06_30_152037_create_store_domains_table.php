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
        Schema::create('store_domains', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_id');              // = users.id (store owner)
            $table->string('domain')->unique();                   // "shopa.yourplatform.com" or "shopA.com"
            $table->enum('type', ['subdomain', 'custom'])->default('subdomain');
            $table->boolean('is_verified')->default(false);       // DNS verification for custom domains
            $table->boolean('is_primary')->default(true);         // Primary domain for this store
            $table->timestamps();

            $table->foreign('owner_id')->references('id')->on('users')->onDelete('cascade');
            $table->index('domain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_domains');
    }
};
