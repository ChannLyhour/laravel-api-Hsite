<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'VHsite Admin')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #080a0f; color: #e2e8f0; }
        .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .sidebar-link { transition: all 0.2s; }
        .sidebar-link:hover { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
        .sidebar-link.active { background: #6366f1 !important; color: white !important; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
        .neon-glow { text-shadow: 0 0 10px rgba(99, 102, 241, 0.5); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        @yield('extra_css')
    </style>
    <script>
        if (!localStorage.getItem('auth_token')) window.location.href = '/admin/login';
    </script>
</head>
<body class="flex h-screen overflow-hidden">

    <!-- Sidebar -->
    <aside class="w-64 glass h-full flex flex-col border-r border-slate-800/50 hidden lg:flex z-20">
        <div class="p-8">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <i class="fa-solid fa-bolt text-white"></i>
                </div>
                <span class="text-xl font-extrabold tracking-tight text-white neon-glow">VHsite</span>
            </div>
        </div>

        <nav class="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Main Menu</p>
            <a href="{{ route('admin.dashboard') }}" class="sidebar-link {{ request()->routeIs('admin.dashboard') || request()->routeIs('admin.manage') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-grid-2"></i> Dashboard
            </a>
            <a href="{{ route('admin.users') }}" class="sidebar-link {{ request()->routeIs('admin.users') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-users"></i> Users
            </a>
            <a href="{{ route('admin.stores') }}" class="sidebar-link {{ request()->routeIs('admin.stores') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-store"></i> Stores
            </a>
            <a href="{{ route('admin.module', ['module' => 'orders']) }}" class="sidebar-link {{ request()->is('admin/orders') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-bag-shopping"></i> Orders
            </a>
            <a href="{{ route('admin.module', ['module' => 'products']) }}" class="sidebar-link {{ request()->is('admin/products') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-box-archive"></i> Products
            </a>

            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mt-8 mb-2">System</p>
            <a href="{{ route('admin.settings') }}" class="sidebar-link {{ request()->routeIs('admin.settings') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-sliders"></i> Settings
            </a>
            <a href="{{ route('admin.module', ['module' => 'health']) }}" class="sidebar-link {{ request()->is('admin/health') ? 'active' : '' }} flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-400">
                <i class="fa-solid fa-heart-pulse"></i> Health
            </a>
        </nav>

        <div class="p-4 border-t border-slate-800/50">
            <button onclick="localStorage.removeItem('auth_token'); window.location.href='/admin/login'" class="w-full flex items-center justify-center gap-2 py-3 text-slate-400 hover:text-rose-400 text-xs font-bold transition-all">
                <i class="fa-solid fa-power-off"></i> TERMINATE SESSION
            </button>
        </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative">
        <!-- Abstract Background Glow -->
        <div class="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[100px] rounded-full"></div>
        <div class="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/5 blur-[100px] rounded-full"></div>

        <!-- Header -->
        <header class="h-20 flex items-center justify-between px-8 z-10 border-b border-slate-800/30">
            <div class="flex items-center gap-4 flex-1">
                <h2 class="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">@yield('header_title', 'System Node')</h2>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex items-center gap-3">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-bold text-white">Chann Lyhour</p>
                        <p class="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Super Admin</p>
                    </div>
                    <img src="https://ui-avatars.com/api/?name=Chann+Lyhour&background=6366f1&color=fff" class="w-10 h-10 rounded-xl border border-slate-700/50">
                </div>
            </div>
        </header>

        <!-- Page Content -->
        <div class="flex-1 overflow-y-auto p-8 pt-6">
            @yield('content')
        </div>
    </main>

    @yield('extra_scripts')
</body>
</html>
