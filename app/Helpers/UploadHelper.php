<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use Intervention\Image\Laravel\Facades\Image;

class UploadHelper
{
    /**
     * Upload an image to the public/uploads directory.
     * Images are resized to max 1000 px wide and saved as WebP at 100% quality
     * using Intervention Image. Falls back to a direct file move if processing fails.
     *
     * @param UploadedFile $file The uploaded file object.
     * @param string $folder The subfolder under public/uploads/ (e.g., 'products').
     * @return string The relative path to the uploaded file (e.g., 'uploads/products/filename.webp').
     */
    public static function uploadImage(UploadedFile $file, string $folder): string
    {
        $destinationPath = public_path('uploads/' . $folder);

        // Check if we are running in a read-only environment like Vercel
        $isVercel = config('app.env') === 'production'
            || !is_writable(public_path())
            || str_contains(config('app.url', ''), 'vercel.app');

        if ($isVercel) {
            try {
                $mimeType = $file->getMimeType();
                $fileData = file_get_contents($file->getRealPath());
                $base64 = base64_encode($fileData);
                return 'data:' . $mimeType . ';base64,' . $base64;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Failed to convert uploaded image to Base64: " . $e->getMessage());
            }
        }

        try {
            if (! File::isDirectory($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true, true);
            }

            // Use Intervention Image v4: scale down to max 1000 px wide, save as WebP 100%
            // In v4: read() → decode(), toWebp() removed — quality passed to save() directly
            $filename = date('dmy_His') . '_' . Str::random(10) . '.webp';
            Image::decode($file->getRealPath())
                ->scaleDown(width: 1000)
                ->save($destinationPath . '/' . $filename, quality: 100);

            return 'uploads/' . $folder . '/' . $filename;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Intervention Image failed, using direct file move: " . $e->getMessage());

            // Fallback: move the original file without compression
            $filename = date('dmy_His') . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            try {
                $file->move($destinationPath, $filename);
                return 'uploads/' . $folder . '/' . $filename;
            } catch (\Exception $ex) {
                \Illuminate\Support\Facades\Log::warning("Upload directory not writable, using Base64 fallback: " . $ex->getMessage());
                try {
                    $mimeType = $file->getMimeType();
                    $fileData = file_get_contents($file->getRealPath());
                    $base64 = base64_encode($fileData);
                    return 'data:' . $mimeType . ';base64,' . $base64;
                } catch (\Exception $exx) {
                    return 'uploads/' . $folder . '/' . $filename;
                }
            }
        }
    }

    /**
     * Delete an image from the public directory.
     *
     * @param string|array|null $imagePath The relative path of the image.
     * @return bool True if deleted, false otherwise.
     */
    public static function deleteImage($imagePath): bool
    {
        if (! $imagePath) {
            return false;
        }

        // If it's a PHP array, delete all paths
        if (is_array($imagePath)) {
            $success = true;
            foreach ($imagePath as $path) {
                if (!self::deleteImage($path)) {
                    $success = false;
                }
            }
            return $success;
        }

        // If it's a JSON array or object string
        if (is_string($imagePath) && (str_starts_with($imagePath, '[') || str_starts_with($imagePath, '{'))) {
            $decoded = json_decode($imagePath, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return self::deleteImage($decoded);
            }
        }

        if (!is_string($imagePath)) {
            return false;
        }

        // Avoid deleting default images or remote URLs
        if (str_starts_with($imagePath, 'http://') || str_starts_with($imagePath, 'https://') || $imagePath === 'default.png') {
            return false;
        }

        // Support stripping full app URLs if stored/passed as full URL
        $baseUrl = url('/');
        if (str_starts_with($imagePath, $baseUrl)) {
            $imagePath = ltrim(substr($imagePath, strlen($baseUrl)), '/');
        }

        // Avoid deleting file if it is still referenced by other products (e.g. duplicated products)
        try {
            if (class_exists(\App\Models\ProductImage::class)) {
                $count = \App\Models\ProductImage::where('image', $imagePath)->count();
                if ($count > 1) {
                    return true;
                }
            }
        } catch (\Exception $e) {
            // Ignore error and proceed
        }

        $fullPath = public_path($imagePath);

        try {
            if (File::exists($fullPath)) {
                return File::delete($fullPath);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning("Could not delete image (serverless fallback): " . $e->getMessage());
        }

        return false;
    }

    /**
     * Update/replace an image. Uploads the new image and deletes the old one.
     *
     * @param string|array|null $oldPath The old relative image path.
     * @param UploadedFile|null $newFile The newly uploaded file.
     * @param string $folder The subfolder name.
     * @return string|null The new image path.
     */
    public static function updateImage($oldPath, ?UploadedFile $newFile, string $folder): ?string
    {
        if (! $newFile) {
            return is_array($oldPath) ? json_encode($oldPath) : $oldPath;
        }

        // Delete the old image first
        self::deleteImage($oldPath);

        // Upload the new image
        return self::uploadImage($newFile, $folder);
    }
}

if (! function_exists('getImagePath')) {
    /**
     * Get the full URL of an image stored in the public directory.
     */
    function getImagePath($imagePath): string
    {
        if (! $imagePath) {
            return asset('default.png');
        }

        // If it's a PHP array, get the first one
        if (is_array($imagePath)) {
            $imagePath = $imagePath[0] ?? null;
        } elseif (is_string($imagePath) && (str_starts_with($imagePath, '[') || str_starts_with($imagePath, '{'))) {
            $decoded = json_decode($imagePath, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $imagePath = $decoded[0] ?? null;
            }
        }

        if (! $imagePath || !is_string($imagePath)) {
            return asset('default.png');
        }

        $fullPath = public_path($imagePath);

        if (File::exists($fullPath)) {
            return asset($imagePath);
        }

        return asset('default.png');
    }
}
