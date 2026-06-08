@extends('admin.layout.app')

@section('title', 'VHsite — System Settings')
@section('header_title', 'Configuration Terminal')

@section('content')
<div class="max-w-4xl mx-auto space-y-12">
    <div>
        <h3 class="text-3xl font-black text-white">System Core</h3>
        <p class="text-slate-500 text-sm mt-2">Global platform configuration and administrative preferences.</p>
    </div>

    <div class="grid grid-cols-1 gap-8">
        
        <!-- Branding Section -->
        <div class="glass p-10 rounded-[2.5rem] border border-slate-800/50 relative overflow-hidden">
            <div class="relative z-10 space-y-8">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-10 h-10 bg-indigo-600/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <i class="fa-solid fa-palette text-indigo-500"></i>
                    </div>
                    <h4 class="text-lg font-bold text-white">Platform Identity</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-3">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Platform Name</label>
                        <input type="text" id="store_name" placeholder="VHsite Marketplace" 
                            class="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all">
                    </div>
                    <div class="space-y-3">
                        <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                        <input type="email" id="store_email" placeholder="admin@vhsite.com" 
                            class="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all">
                    </div>
                </div>

                <div class="pt-4 flex justify-end">
                    <button id="save-btn" class="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">
                        DEPLOY CHANGES
                    </button>
                </div>
            </div>
            <i class="fa-solid fa-gear absolute -right-8 -bottom-8 text-[10rem] text-white/5 rotate-12"></i>
        </div>

        <!-- Security / Maintenance -->
        <div class="glass p-10 rounded-[2.5rem] border border-slate-800/50">
             <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-rose-600/10 rounded-xl flex items-center justify-center border border-rose-500/20">
                        <i class="fa-solid fa-shield-halved text-rose-500"></i>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold text-white">Maintenance Mode</h4>
                        <p class="text-xs text-slate-500 mt-1">Restrict public access during updates.</p>
                    </div>
                </div>
                <div class="w-14 h-7 bg-slate-800 rounded-full relative cursor-pointer border border-slate-700">
                    <div class="absolute left-1 top-1 w-5 h-5 bg-slate-500 rounded-full transition-all"></div>
                </div>
             </div>
        </div>

    </div>
</div>
@endsection

@section('extra_scripts')
<script>
    async function loadSettings() {
        try {
            const response = await fetch('/api/settings', {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });
            const settings = await response.json();
            if (settings.store_name) document.getElementById('store_name').value = settings.store_name;
            if (settings.store_email) document.getElementById('store_email').value = settings.store_email;
        } catch (err) {
            console.error(err);
        }
    }

    document.getElementById('save-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-btn');
        btn.disabled = true;
        btn.innerText = 'DEPLOYING...';

        const data = {
            store_name: document.getElementById('store_name').value,
            store_email: document.getElementById('store_email').value
        };

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                btn.innerText = 'SUCCESS';
                setTimeout(() => { btn.innerText = 'DEPLOY CHANGES'; btn.disabled = false; }, 2000);
            }
        } catch (err) {
            btn.innerText = 'FAILED';
            setTimeout(() => { btn.innerText = 'DEPLOY CHANGES'; btn.disabled = false; }, 2000);
        }
    });

    loadSettings();
</script>
@endsection
