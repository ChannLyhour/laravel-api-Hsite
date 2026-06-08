<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VHsite — {{ ucfirst($module) }} Management</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #080a0f; color: #e2e8f0; }
        .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .sidebar-link:hover { background: rgba(99, 102, 241, 0.1); color: #818cf8; }
        .neon-glow { text-shadow: 0 0 10px rgba(99, 102, 241, 0.5); }
        table tr { border-bottom: 1px solid rgba(255, 255, 255, 0.03); transition: all 0.2s; }
        table tr:hover { background: rgba(255, 255, 255, 0.02); }
    </style>
    <script>
        if (!localStorage.getItem('auth_token')) window.location.href = '/admin/login';
    </script>
</head>
<body class="flex h-screen overflow-hidden">

    <!-- Simple Sidebar -->
    <aside class="w-64 glass h-full flex flex-col border-r border-slate-800/50 hidden lg:flex">
        <div class="p-8">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-bolt text-white text-sm"></i>
                </div>
                <span class="text-lg font-extrabold text-white neon-glow">VHsite</span>
            </div>
        </div>
        <nav class="flex-1 px-4 space-y-1">
            <a href="/" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 sidebar-link">
                <i class="fa-solid fa-grid-2"></i> Dashboard
            </a>
            <a href="/admin/users" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium {{ $module == 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 sidebar-link' }}">
                <i class="fa-solid fa-users"></i> Users
            </a>
            <a href="/admin/stores" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium {{ $module == 'stores' ? 'bg-indigo-600 text-white' : 'text-slate-400 sidebar-link' }}">
                <i class="fa-solid fa-store"></i> Stores
            </a>
            <a href="/admin/orders" class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium {{ $module == 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 sidebar-link' }}">
                <i class="fa-solid fa-bag-shopping"></i> Orders
            </a>
        </nav>
    </aside>

    <!-- Content -->
    <main class="flex-1 flex flex-col overflow-hidden">
        <header class="h-20 flex items-center justify-between px-8 border-b border-slate-800/50">
            <h2 class="text-xl font-bold text-white uppercase tracking-wider">{{ $module }} Explorer</h2>
            <div class="flex items-center gap-4">
                <span id="load-status" class="text-[10px] font-bold text-indigo-400 uppercase animate-pulse">Syncing Data...</span>
                <button onclick="location.reload()" class="w-10 h-10 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                    <i class="fa-solid fa-rotate-right text-sm"></i>
                </button>
            </div>
        </header>

        <div class="flex-1 overflow-auto p-8">
            <div class="glass rounded-[2rem] overflow-hidden border border-slate-800/50 shadow-2xl">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-900/50">
                        <tr id="table-head">
                            <!-- Headers injected via JS -->
                        </tr>
                    </thead>
                    <tbody id="table-body" class="text-sm text-slate-300">
                        <!-- Data injected via JS -->
                    </tbody>
                </table>
                <div id="empty-state" class="hidden p-20 text-center">
                    <i class="fa-solid fa-folder-open text-5xl text-slate-700 mb-4"></i>
                    <p class="text-slate-500 font-medium">No records found in this module.</p>
                </div>
            </div>
        </div>
    </main>

    <script>
        const module = "{{ $module }}";
        const endpoints = {
            users: '/api/users',
            stores: '/api/stores',
            orders: '/api/admin/orders',
            products: '/api/products',
            settings: '/api/settings',
            health: '/api/admin/dashboard' // Using dashboard stats as health indicator for now
        };

        async function fetchData() {
            try {
                const response = await fetch(endpoints[module], {
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Accept': 'application/json'
                    }
                });
                const data = await response.json();
                renderTable(data);
                document.getElementById('load-status').innerText = 'System Synchronized';
                document.getElementById('load-status').classList.remove('animate-pulse');
            } catch (err) {
                document.getElementById('load-status').innerText = 'Connection Failed';
                document.getElementById('load-status').classList.add('text-rose-500');
            }
        }

        function renderTable(data) {
            const head = document.getElementById('table-head');
            const body = document.getElementById('table-body');
            
            if (!data.length) {
                document.getElementById('empty-state').classList.remove('hidden');
                return;
            }

            // Generate Headers based on first item
            const keys = Object.keys(data[0]).filter(k => !['deleted_at', 'updated_at', 'email_verified_at', 'password', 'remember_token'].includes(k));
            head.innerHTML = keys.map(k => `<th class="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">${k.replace('_', ' ')}</th>`).join('');

            // Generate Rows
            body.innerHTML = data.map(item => `
                <tr class="group">
                    ${keys.map(k => {
                        let val = item[k];
                        if (k === 'image' || k === 'logo_url') return `<td class="px-6 py-4"><img src="${val}" class="w-8 h-8 rounded-lg border border-slate-700"></td>`;
                        if (typeof val === 'object') return `<td class="px-6 py-4 text-xs text-slate-500 italic">Object</td>`;
                        return `<td class="px-6 py-4 truncate max-w-[200px]">${val ?? '-'}</td>`;
                    }).join('')}
                </tr>
            `).join('');
        }

        fetchData();
    </script>
</body>
</html>
