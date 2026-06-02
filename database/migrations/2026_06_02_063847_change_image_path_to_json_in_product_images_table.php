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
        // 1. Convert existing non-JSON paths to JSON arrays
        $images = DB::table('product_images')->get();
        foreach ($images as $img) {
            $path = $img->image_path;
            if ($path !== null && $path !== '') {
                // If it's not already a JSON array or object
                if (!str_starts_with($path, '[') && !str_starts_with($path, '{')) {
                    $jsonPath = json_encode([$path]);
                    DB::table('product_images')->where('id', $img->id)->update([
                        'image_path' => $jsonPath
                    ]);
                }
            } else {
                DB::table('product_images')->where('id', $img->id)->update([
                    'image_path' => json_encode([])
                ]);
            }
        }

        // 2. Change column datatype to json
        Schema::table('product_images', function (Blueprint $table) {
            $table->json('image_path')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Change column datatype back to string
        Schema::table('product_images', function (Blueprint $table) {
            $table->string('image_path', 2048)->nullable()->change();
        });

        // Convert JSON array back to a single string (the first element)
        $images = DB::table('product_images')->get();
        foreach ($images as $img) {
            $path = $img->image_path;
            if ($path !== null && $path !== '') {
                $decoded = json_decode($path, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $singlePath = $decoded[0] ?? '';
                    DB::table('product_images')->where('id', $img->id)->update([
                        'image_path' => $singlePath
                    ]);
                }
            }
        }
    }
};
