@extends('admin.layout.app')

@section('title', 'VHsite — Dashboard')
@section('header_title', 'Master Dashboard')

@php
    $userCount = \App\Models\User::count();
    $storeCount = \App\Models\Store::where('key', 'store_name')->count();
    $orderCount = \App\Models\Order::count();
    $revenue = \App\Models\Order::where('payment_status', 'Paid')->sum('total_amount');
    $recentOrders = \App\Models\Order::latest()->take(4)->get();
@endphp

@section('content')
<div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
    <!-- Left Column: Main Stats -->
    <div class="xl:col-span-2 space-y-8">
        
        <!-- Welcome Banner -->
        <div class="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white">Hello, Admin!</h2>
                <p class="text-indigo-100 mt-2 max-w-sm opacity-90 text-sm leading-relaxed">System status: All systems operational. You have {{ $orderCount }} orders to review today.</p>
                <div class="flex gap-4 mt-6">
                    <button class="px-6 py-2.5 bg-white text-indigo-600 rounded-xl font-bold text-xs shadow-lg hover:scale-105 transition-all">ANALYTICS</button>
                    <button class="px-6 py-2.5 bg-indigo-500/50 text-white rounded-xl font-bold text-xs border border-indigo-400/30 backdrop-blur-md hover:bg-indigo-500/60 transition-all">QUICK START</button>
                </div>
            </div>
            <i class="fa-solid fa-cloud-arrow-up absolute -right-8 -bottom-8 text-[12rem] text-white/5 rotate-12"></i>
        </div>

        <!-- Management Folders -->
        <div>
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-bold text-white">Management Core</h3>
                <a href="#" class="text-xs text-indigo-400 font-bold hover:underline uppercase">View Hierarchy</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <a href="/admin/users" class="folder-card glass p-6 rounded-3xl flex flex-col gap-4">
                    <div class="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                        <i class="fa-solid fa-folder-open text-xl text-indigo-500"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Accounts</h4>
                        <p class="text-[10px] text-slate-500 font-medium uppercase mt-1">{{ $userCount }} Files Managed</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <span class="text-[9px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">USERS</span>
                        <i class="fa-solid fa-arrow-right text-[10px] text-slate-600"></i>
                    </div>
                </a>

                <a href="/admin/stores" class="folder-card glass p-6 rounded-3xl flex flex-col gap-4">
                    <div class="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                        <i class="fa-solid fa-folder-tree text-xl text-emerald-500"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Merchants</h4>
                        <p class="text-[10px] text-slate-500 font-medium uppercase mt-1">{{ $storeCount }} Stores Connected</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <span class="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">STORES</span>
                        <i class="fa-solid fa-arrow-right text-[10px] text-slate-600"></i>
                    </div>
                </a>

                <a href="/admin/orders" class="folder-card glass p-6 rounded-3xl flex flex-col gap-4">
                    <div class="w-12 h-12 bg-amber-600/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                        <i class="fa-solid fa-folder-minus text-xl text-amber-500"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-white">Orders</h4>
                        <p class="text-[10px] text-slate-500 font-medium uppercase mt-1">{{ $orderCount }} Items in Stream</p>
                    </div>
                    <div class="flex items-center justify-between pt-4 border-t border-slate-800/50">
                        <span class="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">FINANCE</span>
                        <i class="fa-solid fa-arrow-right text-[10px] text-slate-600"></i>
                    </div>
                </a>

            </div>
        </div>

        <!-- Revenue Graph Placeholder -->
        <div class="glass p-8 rounded-[2rem] border border-slate-800/50">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h3 class="text-xl font-bold text-white">Revenue Performance</h3>
                    <p class="text-xs text-slate-500 mt-1">Total platform earnings this month</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-black text-white">${{ number_format($revenue, 2) }}</p>
                    <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter"><i class="fa-solid fa-caret-up mr-1"></i> +12.5% increase</p>
                </div>
            </div>
            <div class="h-32 w-full bg-indigo-600/5 rounded-2xl border border-dashed border-indigo-500/20 flex items-center justify-center">
                <span class="text-[10px] font-bold text-indigo-400/50 uppercase tracking-[0.2em]">Chart Engine Ready</span>
            </div>
        </div>

    </div>

    <!-- Right Column: Pulse/Activity -->
    <div class="space-y-8">
        
        <!-- Recent Pulse -->
        <div class="glass p-8 rounded-[2rem] border border-slate-800/50">
            <h3 class="text-lg font-bold text-white mb-6">Recent Pulse</h3>
            <div class="space-y-6">
                @forelse($recentOrders as $order)
                <div class="flex gap-4">
                    <div class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-cart-shopping text-sm text-indigo-400"></i>
                    </div>
                    <div class="overflow-hidden">
                        <p class="text-xs font-bold text-white truncate">New Order #{{ substr($order->order_no, -6) }}</p>
                        <p class="text-[10px] text-slate-500 mt-0.5">${{ number_format($order->total_amount, 2) }} • {{ $order->created_at->diffForHumans() }}</p>
                    </div>
                </div>
                @empty
                <p class="text-xs text-slate-500 text-center py-4">No recent activity detected.</p>
                @endforelse
            </div>
            <button class="w-full mt-8 py-3 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-xl hover:bg-slate-700 transition-all border border-slate-700/50">VIEW SYSTEM LOGS</button>
        </div>

        <!-- System Stats -->
        <div class="glass p-8 rounded-[2rem] border border-slate-800/50 relative overflow-hidden">
            <div class="relative z-10">
                <h3 class="text-lg font-bold text-white mb-6">Environment</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-500 uppercase">Server Status</span>
                        <span class="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded">OPERATIONAL</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold text-slate-500 uppercase">DB Latency</span>
                        <span class="text-[10px] font-bold text-white">12ms</span>
                    </div>
                </div>
            </div>
            <i class="fa-solid fa-server absolute -right-4 -bottom-4 text-6xl text-white/5"></i>
        </div>

    </div>
</div>
@endsection
