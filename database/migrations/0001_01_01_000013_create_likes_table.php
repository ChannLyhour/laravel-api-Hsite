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
        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('likeable_type');
            $table->unsignedBigInteger('likeable_id');
            $table->timestamps();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->unique(['user_id', 'likeable_id', 'likeable_type'], 'user_like_unique');
            $table->index(['likeable_type', 'likeable_id']);
            $table->index(['likeable_id', 'likeable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('likes');
    }
};
