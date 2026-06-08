@extends('admin.layout.app')

@section('title', 'VHsite — User Management')
@section('header_title', 'Security & Access Control')

@section('content')
<div class="space-y-8">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold text-white">System Accounts</h3>
            <p class="text-slate-500 text-sm mt-1">Manage administrators, store owners, and customer credentials.</p>
        </div>
        <div class="flex gap-4">
            <button onclick="location.reload()" class="px-5 py-2.5 glass rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all text-slate-400">
                <i class="fa-solid fa-rotate-right mr-2"></i> Sync
            </button>
            <button class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                <i class="fa-solid fa-user-plus mr-2"></i> Create Account
            </button>
        </div>
    </div>

    <div class="glass rounded-[2.5rem] overflow-hidden border border-slate-800/50 shadow-2xl">
        <table class="w-full text-left border-collapse">
            <thead class="bg-slate-900/50">
                <tr>
                    <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                    <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Identity</th>
                    <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Level</th>
                    <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th class="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody id="user-table-body" class="text-sm text-slate-300">
                <tr class="animate-pulse">
                    <td colspan="5" class="px-8 py-24 text-center text-slate-600 font-bold uppercase tracking-[0.4em]">Establishing Secure Data Stream...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
@endsection

@section('extra_scripts')
<script>
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users', {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });
            const users = await response.json();
            
            const body = document.getElementById('user-table-body');
            body.innerHTML = users.map(user => {
                let roleBadge = '';
                if (user.role_id == 1) roleBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                else if (user.role_id == 30003) roleBadge = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                else roleBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                const roleName = user.role_id == 1 ? 'ADMIN' : (user.role_id == 30003 ? 'OWNER' : 'CUSTOMER');

                return `
                <tr class="hover:bg-white/5 transition-all group border-b border-slate-800/30">
                    <td class="px-8 py-6">
                        <div class="flex items-center gap-4">
                            <img src="${user.image || 'https://ui-avatars.com/api/?name=' + user.name + '&background=1e293b&color=fff'}" 
                                class="w-12 h-12 rounded-2xl border border-slate-800 group-hover:border-indigo-500/50 transition-all shadow-lg">
                            <div>
                                <p class="font-bold text-white group-hover:text-indigo-400 transition-colors">${user.name}</p>
                                <p class="text-[10px] text-slate-500 font-medium uppercase mt-0.5 tracking-tighter">ID: ${user.id}</p>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-6 text-slate-400 font-medium">${user.email}</td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1.5 rounded-xl border text-[9px] font-black tracking-widest ${roleBadge}">
                            ${roleName}
                        </span>
                    </td>
                    <td class="px-8 py-6">
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${user.state || 'active'}</span>
                        </div>
                    </td>
                    <td class="px-8 py-6 text-right">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all border border-slate-700/50">
                                <i class="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all border border-slate-700/50">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `}).join('');
        } catch (err) {
            console.error('Handshake failed:', err);
        }
    }
    fetchUsers();
</script>
@endsection
