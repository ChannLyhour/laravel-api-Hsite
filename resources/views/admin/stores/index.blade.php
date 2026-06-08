@extends('admin.layout.app')

@section('title', 'VHsite — Store Management')
@section('header_title', 'Merchant Ecosystem')

@section('content')
<div class="space-y-8">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold text-white">Stores & Merchants</h3>
            <p class="text-slate-500 text-sm mt-1">Manage all registered store profiles and their settings.</p>
        </div>
        <button onclick="location.reload()" class="px-6 py-2.5 glass rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">
            <i class="fa-solid fa-sync mr-2"></i> Refresh Data
        </button>
    </div>

    <div class="glass rounded-[2rem] overflow-hidden border border-slate-800/50 shadow-2xl">
        <table class="w-full text-left border-collapse">
            <thead class="bg-slate-900/50">
                <tr id="table-head">
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Logo</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Store Name</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Owner</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                </tr>
            </thead>
            <tbody id="table-body" class="text-sm text-slate-300">
                <tr class="animate-pulse">
                    <td colspan="6" class="px-8 py-20 text-center text-slate-600 font-bold uppercase tracking-[0.3em]">Synchronizing Merchant Stream...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
@endsection

@section('extra_scripts')
<script>
    async function loadStores() {
        try {
            const response = await fetch('/api/stores', {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });
            const data = await response.json();
            
            const body = document.getElementById('table-body');
            body.innerHTML = data.map(store => `
                <tr class="hover:bg-white/5 transition-all group">
                    <td class="px-8 py-5 font-mono text-xs text-slate-500">${store.id}</td>
                    <td class="px-8 py-5">
                        <img src="${store.logo_url || 'https://ui-avatars.com/api/?name=' + (store.store_name || 'S')}" class="w-10 h-10 rounded-xl border border-slate-800">
                    </td>
                    <td class="px-8 py-5 font-bold text-white">${store.store_name || 'Unnamed Store'}</td>
                    <td class="px-8 py-5 text-slate-400">${store.store_email || '-'}</td>
                    <td class="px-8 py-5">
                        <span class="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/20">OWNER ID: ${store.owner_id}</span>
                    </td>
                    <td class="px-8 py-5">
                        <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:text-indigo-400 transition-all">
                            <i class="fa-solid fa-ellipsis-v"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error(err);
        }
    }
    loadStores();
</script>
@endsection
