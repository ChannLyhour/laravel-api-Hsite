<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('admin.index');
})->name('admin.dashboard');

Route::get('/admin/manage', function () {
    return view('admin.index');
})->name('admin.manage');

Route::get('/admin/stores', function () {
    return view('admin.stores.index');
})->name('admin.stores');

Route::get('/admin/users', function () {
    return view('admin.users.index');
})->name('admin.users');

Route::get('/admin/settings', function () {
    return view('admin.settings.index');
})->name('admin.settings');

Route::get('/admin/{module}', function ($module) {
    $validModules = ['orders', 'products', 'health'];
    if (!in_array($module, $validModules)) abort(404);
    return view('admin.manager', ['module' => $module]);
})->name('admin.module');

Route::get('/admin/login', function () {
    return view('admin.auth.login');
});

// Static Asset Router & Premium Unsplash Fallback
Route::get('/static/{path}', function ($path) {
    $fullPath = public_path('static/' . $path);
    if (file_exists($fullPath)) {
        return response()->file($fullPath);
    }

    // High-resolution Unsplash food or user avatar placeholders
    if (str_contains(strtolower($path), 'user') || str_contains(strtolower($path), 'avatar') || str_contains(strtolower($path), 'photo_2026')) {
        return redirect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }

    // Seed-specific gourmet food fallbacks
    if (str_contains(strtolower($path), 'steak')) {
        return redirect('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'lemonade')) {
        return redirect('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'milkshake')) {
        return redirect('https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'pizza')) {
        return redirect('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80');
    }

    abort(404);
})->where('path', '.*');

// Uploaded Asset Router & Premium Unsplash Fallback
Route::get('/uploads/{path}', function ($path) {
    $fullPath = public_path('uploads/' . $path);
    if (file_exists($fullPath)) {
        return response()->file($fullPath);
    }

    // High-resolution Unsplash food or user avatar placeholders
    if (str_contains(strtolower($path), 'user') || str_contains(strtolower($path), 'avatar') || str_contains(strtolower($path), 'photo_2026')) {
        return redirect('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
    }

    // Seed-specific gourmet food fallbacks
    if (str_contains(strtolower($path), 'steak')) {
        return redirect('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'lemonade')) {
        return redirect('https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'milkshake')) {
        return redirect('https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=600&q=80');
    }
    if (str_contains(strtolower($path), 'pizza')) {
        return redirect('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80');
    }

    abort(404);
})->where('path', '.*');
