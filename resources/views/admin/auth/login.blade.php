<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VHsite — Secure Admin Login</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #080a0f; color: #e2e8f0; overflow: hidden; }
        .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .neon-glow { text-shadow: 0 0 15px rgba(99, 102, 241, 0.6); }
        .input-glass { background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); transition: all 0.3s; }
        .input-glass:focus { border-color: rgba(99, 102, 241, 0.5); background: rgba(0, 0, 0, 0.3); box-shadow: 0 0 20px rgba(99, 102, 241, 0.1); }
        .btn-premium { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); transition: all 0.3s; }
        .btn-premium:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.5); }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen relative">
    
    <!-- Abstract Background Orbs -->
    <div class="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
    <div class="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s"></div>

    <div class="w-full max-w-md px-6 z-10">
        <!-- Brand -->
        <div class="flex flex-col items-center mb-10 text-center">
            <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mb-6 group transition-all duration-500 hover:rotate-[360deg]">
                <i class="fa-solid fa-bolt text-white text-3xl"></i>
            </div>
            <h1 class="text-3xl font-extrabold tracking-tight text-white neon-glow">VHsite Control</h1>
            <p class="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Authentication Gateway</p>
        </div>

        <!-- Login Card -->
        <div class="glass p-8 rounded-[2.5rem] shadow-2xl">
            <h2 class="text-xl font-bold text-white mb-2">Welcome Back</h2>
            <p class="text-slate-500 text-xs mb-8">Enter your credentials to access the master terminal.</p>

            <form id="loginForm" class="space-y-6">
                <div>
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Administrator Email</label>
                    <div class="relative">
                        <i class="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                        <input type="email" name="email" required placeholder="admin@vhsite.com" 
                            class="input-glass w-full py-3.5 pl-11 pr-4 rounded-2xl text-sm text-white focus:outline-none placeholder:text-slate-600">
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center mb-2 ml-1">
                        <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Key</label>
                        <a href="#" class="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Forgot Key?</a>
                    </div>
                    <div class="relative">
                        <i class="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                        <input type="password" name="password" required placeholder="••••••••" 
                            class="input-glass w-full py-3.5 pl-11 pr-4 rounded-2xl text-sm text-white focus:outline-none placeholder:text-slate-600">
                    </div>
                </div>

                <div class="flex items-center gap-2 ml-1">
                    <input type="checkbox" id="remember" class="w-4 h-4 rounded border-slate-700 bg-slate-900 accent-indigo-600">
                    <label for="remember" class="text-[11px] text-slate-500 font-medium select-none">Maintain secure session for 24h</label>
                </div>

                <button type="submit" class="btn-premium w-full py-4 rounded-2xl text-white text-xs font-bold uppercase tracking-[0.2em] shadow-lg">
                    Initialize Session
                </button>
            </form>

            <!-- Status Indicator -->
            <div id="status" class="mt-6 text-center text-[10px] font-bold uppercase tracking-widest hidden"></div>
        </div>

        <!-- Footer -->
        <p class="text-center text-slate-600 text-[10px] mt-10 font-medium uppercase tracking-[0.2em]">
            VHsite &copy; 2026 • Encrypted Management Environment
        </p>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const status = document.getElementById('status');
            const formData = new FormData(e.target);
            
            // UI Feedback
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch animate-spin mr-2"></i> Authenticating...';
            status.className = 'mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-indigo-400';
            status.innerText = 'Establishing secure handshake...';
            status.classList.remove('hidden');

            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                const data = await response.json();

                if (response.ok) {
                    status.className = 'mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-emerald-500';
                    status.innerText = 'Access Granted. Redirecting...';
                    
                    // Store token (standard practice for Sanctum)
                    localStorage.setItem('auth_token', data.access_token);
                    
                    setTimeout(() => {
                        window.location.href = '/admin/manage';
                    }, 1000);
                } else {
                    throw new Error(data.detail || 'Authentication failed');
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerText = 'Initialize Session';
                status.className = 'mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-rose-500';
                status.innerText = err.message;
            }
        });
    </script>
</body>
</html>
