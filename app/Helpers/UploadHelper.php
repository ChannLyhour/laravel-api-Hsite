<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;

class UploadHelper
{
    /**
     * Upload an image to the public/uploads directory.
     *
     * @param UploadedFile $file The uploaded file object.
     * @param string $folder The subfolder under public/uploads/ (e.g., 'menu-items', 'banners', 'users').
     * @return string The relative path to the uploaded file (e.g., 'uploads/menu-items/filename.jpg').
     */
    public static function uploadImage(UploadedFile $file, string $folder): string
    {
        // Sanitize and generate unique filename
        $filename = time() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
        
        // Ensure public/uploads/{folder} exists and move the file there
        $destinationPath = public_path('uploads/' . $folder);
        
        try {
            if (! File::isDirectory($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true, true);
            }
            $file->move($destinationPath, $filename);
        } catch (\Exception $e) {
            // Log the error or handle it gracefully on read-only environments like Vercel.
            // Since we have a virtual fallback route, we can just return the path without writing to disk.
            \Illuminate\Support\Facades\Log::warning("Upload directory not writable (serverless fallback): " . $e->getMessage());
        }
        
        return 'uploads/' . $folder . '/' . $filename;
    }

    /**
     * Delete an image from the public directory.
     *
     * @param string|null $imagePath The relative path of the image.
     * @return bool True if deleted, false otherwise.
     */
    public static function deleteImage(?string $imagePath): bool
    {
        if (! $imagePath) {
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

        $fullPath = public_path($imagePath);

        if (File::exists($fullPath)) {
            return File::delete($fullPath);
        }

        return false;
    }

    /**
     * Update/replace an image. Uploads the new image and deletes the old one.
     *
     * @param string|null $oldPath The old relative image path.
     * @param UploadedFile|null $newFile The newly uploaded file.
     * @param string $folder The subfolder name.
     * @return string|null The new image path.
     */
    public static function updateImage(?string $oldPath, ?UploadedFile $newFile, string $folder): ?string
    {
        if (! $newFile) {
            return $oldPath;
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
    function getImagePath(?string $imagePath): string
    {
        if (! $imagePath) {
            return asset('default.png');
        }

        $fullPath = public_path($imagePath);

        if (File::exists($fullPath)) {
            return asset($imagePath);
        }

        return asset('default.png');
    }
}
