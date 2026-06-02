<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('logo', 2048)->nullable();
            $table->boolean('status')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });

        // Seed some default brands
        $brands = [
            ['name' => 'Apple', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Samsung', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nike', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Adidas', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Zara', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Ikea', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Coca-Cola', 'status' => true, 'created_at' => now(), 'updated_at' => now()],
        ];
        DB::table('brands')->insert($brands);

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')->nullable()->after('product_type')->constrained('brands')->nullOnDelete();
            $table->dropColumn('brand');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand', 100)->nullable()->after('product_type');
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        Schema::dropIfExists('brands');
    }
};
