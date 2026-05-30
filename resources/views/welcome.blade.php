<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Interactive RESTful API Documentation and developer portal for the Food Ordering System. Powered by Laravel & Sanctum.">
    <title>Food Ordering System — REST API Portal</title>
    
    <!-- Premium Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- FontAwesome for Premium Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        :root {
            /* Dark Theme (Default) */
            --bg-main: #080b11;
            --bg-card: #0f131a;
            --bg-sidebar: #0b0e14;
            --bg-code: #090b10;
            --border-color: #1e293b;
            --border-glow: rgba(99, 102, 241, 0.1);
            
            --text-main: #f3f4f6;
            --text-heading: #ffffff;
            --text-muted: #9ca3af;
            
            --primary: #6366f1;
            --primary-rgb: 99, 102, 241;
            --primary-hover: #4f46e5;
            
            --method-get: #10b981;
            --method-post: #3b82f6;
            --method-put: #f59e0b;
            --method-delete: #ef4444;
            
            --status-green: #10b981;
            --status-red: #ef4444;
            --status-yellow: #f59e0b;
        }

        body.light-theme {
            /* Light Theme Toggle */
            --bg-main: #f8fafc;
            --bg-card: #ffffff;
            --bg-sidebar: #f1f5f9;
            --bg-code: #0f172a;
            --border-color: #e2e8f0;
            --border-glow: rgba(99, 102, 241, 0.05);
            
            --text-main: #334155;
            --text-heading: #0f172a;
            --text-muted: #64748b;
            
            --primary: #4f46e5;
            --primary-rgb: 79, 70, 229;
            --primary-hover: #4338ca;
            
            --method-get: #059669;
            --method-post: #2563eb;
            --method-put: #d97706;
            --method-delete: #dc2626;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            transition: background-color 0.25s ease, border-color 0.25s ease;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: var(--bg-main);
            color: var(--text-main);
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* Ambient background glow objects */
        .ambient-glow-1 {
            position: absolute;
            top: -10%;
            right: 10%;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(var(--primary-rgb), 0.15) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
            pointer-events: none;
        }
        
        .ambient-glow-2 {
            position: absolute;
            bottom: -5%;
            left: 5%;
            width: 350px;
            height: 350px;
            background: radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, rgba(0,0,0,0) 70%);
            z-index: -1;
            pointer-events: none;
        }

        /* Top Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 2rem;
            background-color: var(--bg-sidebar);
            border-bottom: 1px solid var(--border-color);
            z-index: 10;
        }

        .logo-section {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .logo-icon {
            font-size: 1.5rem;
            color: var(--primary);
            background: linear-gradient(135deg, var(--primary), #a855f7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 2px 8px rgba(var(--primary-rgb), 0.3));
        }

        .logo-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: var(--text-heading);
        }

        .logo-badge {
            background-color: rgba(var(--primary-rgb), 0.1);
            color: var(--primary);
            padding: 0.15rem 0.5rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
            border: 1px solid rgba(var(--primary-rgb), 0.2);
        }

        .header-controls {
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .health-badge {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background-color: rgba(16, 185, 129, 0.08);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: var(--status-green);
            padding: 0.4rem 0.8rem;
            border-radius: 8px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
        }

        .health-pulse {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--status-green);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            animation: pulse 1.8s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
            }
            100% {
                transform: scale(0.95);
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
            }
        }

        .theme-toggle-btn {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            padding: 0.5rem;
            border-radius: 8px;
            cursor: pointer;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .theme-toggle-btn:hover {
            border-color: var(--primary);
            color: var(--primary);
        }

        /* Layout Container */
        .app-container {
            display: flex;
            flex: 1;
            overflow: hidden;
            position: relative;
        }

        /* Sidebar Style */
        .sidebar {
            width: 320px;
            background-color: var(--bg-sidebar);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .sidebar-search {
            padding: 1.25rem 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .search-box-wrapper {
            position: relative;
        }

        .search-box-wrapper i {
            position: absolute;
            left: 0.85rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 0.9rem;
        }

        .search-input {
            width: 100%;
            background-color: var(--bg-main);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.6rem 0.75rem 0.6rem 2.25rem;
            color: var(--text-main);
            font-size: 0.85rem;
            outline: none;
        }

        .search-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--border-glow);
        }

        .sidebar-menu {
            flex: 1;
            overflow-y: auto;
            padding: 1rem 0;
        }

        .category-group {
            margin-bottom: 1.5rem;
        }

        .category-header {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            padding: 0 1.25rem 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .endpoint-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1.25rem;
            cursor: pointer;
            text-decoration: none;
            color: var(--text-muted);
            font-size: 0.82rem;
            border-left: 3px solid transparent;
        }

        .endpoint-item:hover {
            color: var(--text-main);
            background-color: rgba(var(--primary-rgb), 0.03);
        }

        .endpoint-item.active {
            color: var(--text-heading);
            background-color: rgba(var(--primary-rgb), 0.06);
            border-left-color: var(--primary);
            font-weight: 500;
        }

        .method-pill {
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.15rem 0.4rem;
            border-radius: 4px;
            width: 50px;
            text-align: center;
            flex-shrink: 0;
        }

        .method-get {
            background-color: rgba(16, 185, 129, 0.12);
            color: var(--method-get);
            border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .method-post {
            background-color: rgba(59, 130, 246, 0.12);
            color: var(--method-post);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .method-put {
            background-color: rgba(245, 158, 11, 0.12);
            color: var(--method-put);
            border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .method-delete {
            background-color: rgba(239, 68, 68, 0.12);
            color: var(--method-delete);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .path-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-family: 'Fira Code', monospace;
            font-size: 0.78rem;
        }

        /* Center documentation details */
        .doc-panel {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        /* Quick Credentials Box */
        .credentials-card {
            background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05) 0%, rgba(168, 85, 247, 0.03) 100%);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 1.25rem;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .credentials-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
            cursor: pointer;
        }

        .credentials-title {
            font-size: 0.95rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-heading);
        }

        .credentials-title i {
            color: var(--primary);
        }

        .credentials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .cred-item {
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.75rem;
        }

        .cred-role {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.4rem;
            display: flex;
            justify-content: space-between;
        }

        .role-admin { color: #f43f5e; }
        .role-owner { color: #a855f7; }
        .role-customer { color: #06b6d4; }

        .cred-field {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            margin-top: 0.3rem;
            font-family: 'Fira Code', monospace;
        }

        .cred-field span {
            color: var(--text-muted);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 150px;
        }

        .copy-icon-btn {
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0.2rem;
            font-size: 0.75rem;
        }

        .copy-icon-btn:hover {
            color: var(--primary);
        }

        /* Route detail presentation */
        .route-header {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }

        .route-tagline {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .route-method {
            font-size: 0.85rem;
            font-weight: 800;
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            text-transform: uppercase;
        }

        .route-path {
            font-family: 'Fira Code', monospace;
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--text-heading);
            word-break: break-all;
        }

        .route-auth-badge {
            background-color: rgba(var(--primary-rgb), 0.08);
            border: 1px solid rgba(var(--primary-rgb), 0.2);
            color: var(--primary);
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .route-description {
            font-size: 0.95rem;
            line-height: 1.5;
            color: var(--text-muted);
        }

        /* Doc detail tables */
        .doc-section-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-heading);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .doc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
        }

        .doc-table th, .doc-table td {
            text-align: left;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.85rem;
        }

        .doc-table th {
            font-weight: 600;
            color: var(--text-heading);
            background-color: rgba(var(--primary-rgb), 0.02);
        }

        .param-name {
            font-family: 'Fira Code', monospace;
            font-weight: 600;
            color: var(--primary);
        }

        .param-type {
            font-size: 0.75rem;
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border-color);
            padding: 0.1rem 0.35rem;
            border-radius: 4px;
            color: var(--text-muted);
        }

        .param-req {
            color: var(--status-red);
            font-size: 0.7rem;
            font-weight: 600;
        }

        .param-opt {
            color: var(--text-muted);
            font-size: 0.7rem;
        }

        /* Right panel (Code snippet / Try it console) */
        .right-panel {
            width: 460px;
            background-color: var(--bg-sidebar);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .panel-tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            background-color: rgba(0,0,0,0.15);
        }

        .panel-tab {
            flex: 1;
            padding: 0.75rem 0.5rem;
            text-align: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--text-muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }

        .panel-tab:hover {
            color: var(--text-main);
        }

        .panel-tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
            background-color: var(--bg-card);
        }

        .panel-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-card);
        }

        .console-header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1.25rem;
            background-color: rgba(0,0,0,0.1);
            border-bottom: 1px solid var(--border-color);
        }

        .console-title {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
        }

        .console-action-row {
            display: flex;
            gap: 0.5rem;
        }

        .btn-action {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.35rem;
        }

        .btn-action:hover {
            background-color: var(--primary-hover);
        }

        .btn-secondary {
            background: none;
            border: 1px solid var(--border-color);
            color: var(--text-main);
        }

        .btn-secondary:hover {
            border-color: var(--primary);
            color: var(--primary);
        }

        /* Interactive Sandbox Form */
        .sandbox-container {
            padding: 1.25rem;
            overflow-y: auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }

        .form-label {
            font-size: 0.78rem;
            font-weight: 600;
            color: var(--text-heading);
            display: flex;
            justify-content: space-between;
        }

        .form-label span {
            font-family: 'Fira Code', monospace;
            font-size: 0.7rem;
            color: var(--primary);
        }

        .form-input {
            width: 100%;
            background-color: var(--bg-main);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 0.5rem 0.75rem;
            color: var(--text-main);
            font-size: 0.82rem;
            outline: none;
            font-family: 'Fira Code', monospace;
        }

        .form-input:focus {
            border-color: var(--primary);
        }

        /* JSON Code Box */
        .code-container {
            position: relative;
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .code-content {
            margin: 0;
            padding: 1.25rem;
            overflow: auto;
            font-family: 'Fira Code', monospace;
            font-size: 0.8rem;
            line-height: 1.5;
            background-color: var(--bg-code);
            color: #d1d5db;
            flex: 1;
        }

        /* JSON Highlighting Colors */
        .json-key { color: #f43f5e; font-weight: 500; }
        .json-string { color: #10b981; }
        .json-number { color: #f59e0b; }
        .json-boolean { color: #a855f7; }
        .json-null { color: #6b7280; }

        /* Dynamic Copy Popup feedback */
        .copy-toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background-color: #10b981;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            z-index: 100;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .copy-toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
            .app-container {
                flex-direction: column;
                overflow-y: auto;
            }
            .sidebar {
                width: 100%;
                height: 300px;
                border-right: none;
                border-bottom: 1px solid var(--border-color);
            }
            .right-panel {
                width: 100%;
                height: 400px;
                border-left: none;
                border-top: 1px solid var(--border-color);
            }
            body {
                overflow-y: auto;
                height: auto;
            }
        }
    </style>
</head>
<body>

    <div class="ambient-glow-1"></div>
    <div class="ambient-glow-2"></div>

    <!-- Header Section -->
    <header>
        <div class="logo-section">
            <i class="fa-solid fa-fire-burner logo-icon"></i>
            <span class="logo-title">Food Ordering REST API</span>
            <span class="logo-badge">v1.0</span>
        </div>

        <div class="header-controls">
            <!-- Server Health Indicator -->
            <div id="healthIndicator" class="health-badge" onclick="checkServerHealth()">
                <div class="health-pulse"></div>
                <span id="healthStatusText">Checking connection...</span>
            </div>

            <!-- Light/Dark Mode Toggle -->
            <button class="theme-toggle-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle Dark/Light Mode">
                <i class="fa-solid fa-moon"></i>
            </button>
        </div>
    </header>

    <!-- App Main Workspace -->
    <div class="app-container">
        
        <!-- Sidebar Navigation -->
        <div class="sidebar">
            <div class="sidebar-search">
                <div class="search-box-wrapper">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="searchInput" class="search-input" placeholder="Filter endpoints..." onkeyup="filterEndpoints()">
                </div>
            </div>

            <div class="sidebar-menu" id="endpointsMenu">
                <!-- Javascript will populate this based on route structure -->
            </div>
        </div>

        <!-- Documentation Details Panel -->
        <div class="doc-panel" id="docPanel">
            
            <!-- Default Welcome Dashboard Info -->
            <div id="welcomeDocs" style="display: block;">
                <h1 style="font-family: 'Outfit', sans-serif; font-size: 2.25rem; font-weight: 800; color: var(--text-heading); margin-bottom: 0.5rem;">
                    REST API Workspace
                </h1>
                <p style="color: var(--text-muted); font-size: 1rem; margin-bottom: 2rem;">
                    Welcome to the backend API portal. Here you can explore route parameters, authenticate requests, view response structures, and interact with the endpoints live.
                </p>

                <!-- Credentials Chest -->
                <div class="credentials-card">
                    <div class="credentials-header" onclick="toggleCredentialsChest()">
                        <div class="credentials-title">
                            <i class="fa-solid fa-key"></i>
                            <span>Developer Seed Accounts Chest</span>
                        </div>
                        <i class="fa-solid fa-chevron-down" id="chestChevron" style="color: var(--text-muted);"></i>
                    </div>
                    
                    <div class="credentials-grid" id="credentialsGrid">
                        <!-- Admin Profile -->
                        <div class="cred-item">
                            <div class="cred-role role-admin">
                                <span>Administrator</span>
                                <span style="font-size: 0.65rem;">Role ID: 1</span>
                            </div>
                            <div class="cred-field">
                                <span>admin@gmail.com</span>
                                <button class="copy-icon-btn" onclick="copyText('admin@gmail.com')" title="Copy Email">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                            <div class="cred-field">
                                <span>admin1234</span>
                                <button class="copy-icon-btn" onclick="copyText('admin1234')" title="Copy Password">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Merchant/Owner Profile -->
                        <div class="cred-item">
                            <div class="cred-role role-owner">
                                <span>Store Owner</span>
                                <span style="font-size: 0.65rem;">Role ID: 30003</span>
                            </div>
                            <div class="cred-field">
                                <span>owner@gmail.com</span>
                                <button class="copy-icon-btn" onclick="copyText('owner@gmail.com')" title="Copy Email">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                            <div class="cred-field">
                                <span>owner1234</span>
                                <button class="copy-icon-btn" onclick="copyText('owner1234')" title="Copy Password">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Customer Profile -->
                        <div class="cred-item">
                            <div class="cred-role role-customer">
                                <span>Customer</span>
                                <span style="font-size: 0.65rem;">Role ID: 2</span>
                            </div>
                            <div class="cred-field">
                                <span>customer@gmail.com</span>
                                <button class="copy-icon-btn" onclick="copyText('customer@gmail.com')" title="Copy Email">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                            <div class="cred-field">
                                <span>customer1234</span>
                                <button class="copy-icon-btn" onclick="copyText('customer1234')" title="Copy Password">
                                    <i class="fa-regular fa-copy"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- API Base URL Info -->
                <div style="margin-top: 2rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-heading);">API Base URL</div>
                    <div style="display: flex; gap: 0.5rem; max-width: 500px;">
                        <input type="text" id="baseUrlInput" class="form-input" style="font-family: 'Fira Code', monospace; font-size: 0.8rem;" readonly>
                        <button class="btn-action" onclick="copyBaseUrl()"><i class="fa-regular fa-copy"></i> Copy</button>
                    </div>
                </div>

                <!-- Quick start block -->
                <div style="margin-top: 2.5rem; display: flex; flex-direction: column; gap: 1rem;">
                    <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: var(--text-heading);">
                        Quick Integration Guide
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem;">
                        <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 10px;">
                            <div style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.75rem;"><i class="fa-solid fa-shield-halved"></i></div>
                            <h4 style="color: var(--text-heading); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem;">Sanctum Token Authorization</h4>
                            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
                                Login via <code>/api/login</code> with appropriate role credentials. Attach the returned token in the headers as: <br>
                                <code>Authorization: Bearer &lt;token&gt;</code>
                            </p>
                        </div>

                        <div style="background-color: var(--bg-card); border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 10px;">
                            <div style="font-size: 1.5rem; color: #10b981; margin-bottom: 0.75rem;"><i class="fa-solid fa-code-fork"></i></div>
                            <h4 style="color: var(--text-heading); font-size: 0.95rem; font-weight: 600; margin-bottom: 0.5rem;">File Upload Method Spoofing</h4>
                            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;">
                                Laravel's multipart parser cannot decode binary inputs from raw <code>PUT</code> requests. When updating items with images, send a <code>POST</code> request and route spoof with <code>_method: PUT</code>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dynamic Documentation Content -->
            <div id="dynamicDocs" style="display: none;">
                <!-- Header detail -->
                <div class="route-header">
                    <div class="route-tagline">
                        <span id="routeMethodBadge" class="route-method"></span>
                        <span id="routePathText" class="route-path"></span>
                        <span id="routeAuthBadge" class="route-auth-badge"></span>
                    </div>
                    <p id="routeDescriptionText" class="route-description"></p>
                </div>

                <!-- Headers Table -->
                <div id="headersSection">
                    <div class="doc-section-title">
                        <i class="fa-solid fa-list-check"></i> Required Headers
                    </div>
                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th>Header Key</th>
                                <th>Expected Value</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody id="headersTableBody"></tbody>
                    </table>
                </div>

                <!-- Request Parameters Table (Query/Body) -->
                <div id="paramsSection">
                    <div class="doc-section-title" id="paramsSectionTitle">
                        <i class="fa-solid fa-gears"></i> Request Schema
                    </div>
                    <table class="doc-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Type</th>
                                <th>Requirement</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody id="paramsTableBody"></tbody>
                    </table>
                </div>
            </div>

        </div>

        <!-- Interactive Sandbox Panel / Snippets -->
        <div class="right-panel">
            <div class="panel-tabs">
                <div class="panel-tab active" id="tab-response" onclick="switchRightTab('response')">Response Schema</div>
                <div class="panel-tab" id="tab-console" onclick="switchRightTab('console')">Console</div>
                <div class="panel-tab" id="tab-curl" onclick="switchRightTab('curl')">cURL</div>
                <div class="panel-tab" id="tab-js" onclick="switchRightTab('js')">JS (Fetch)</div>
                <div class="panel-tab" id="tab-python" onclick="switchRightTab('python')">Python</div>
            </div>

            <div class="panel-body">
                
                <!-- Response schema view -->
                <div id="pane-response" class="code-container" style="display: flex;">
                    <div class="console-header-bar">
                        <span class="console-title">Mock Response Payload</span>
                        <button class="copy-icon-btn" onclick="copyConsoleCode()" title="Copy Response JSON">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre class="code-content"><code id="responseCodeBlock"></code></pre>
                </div>

                <!-- Live console view -->
                <div id="pane-console" class="sandbox-container" style="display: none;">
                    <div style="font-size: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
                        Attach credentials to run live queries against the active backend server.
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Bearer Token <span>Authorization</span></label>
                        <input type="text" id="consoleTokenInput" class="form-input" placeholder="Paste your Sanctum token...">
                    </div>

                    <div id="consoleDynamicInputs">
                        <!-- Dynamic inputs for currently active endpoint parameter form -->
                    </div>

                    <div class="console-action-row" style="margin-top: 1rem;">
                        <button class="btn-action" onclick="runLiveRequest()"><i class="fa-solid fa-play"></i> Send Request</button>
                        <button class="btn-action btn-secondary" onclick="clearConsoleResponse()"><i class="fa-solid fa-trash-can"></i> Clear</button>
                    </div>

                    <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; flex: 1; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="console-title">Live Response Console</span>
                            <span id="consoleStatusPill" class="method-pill" style="display: none; width: auto; padding: 0.2rem 0.5rem;"></span>
                        </div>
                        <div class="code-container">
                            <pre class="code-content" style="border: 1px solid var(--border-color); border-radius: 6px;"><code id="consoleResponseCode">No request sent yet.</code></pre>
                        </div>
                    </div>
                </div>

                <!-- Code Snippets View (cURL, JS, Python) -->
                <div id="pane-snippets" class="code-container" style="display: none;">
                    <div class="console-header-bar">
                        <span class="console-title" id="snippetTitle">Code Snippet</span>
                        <button class="copy-icon-btn" onclick="copyConsoleCode()" title="Copy Snippet">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre class="code-content"><code id="snippetCodeBlock"></code></pre>
                </div>

            </div>
        </div>

    </div>

    <!-- Copy Feedback Notification -->
    <div id="copyToast" class="copy-toast">
        <i class="fa-solid fa-circle-check"></i>
        <span id="copyToastText">Copied to clipboard!</span>
    </div>

    <script>
        // Set local environment base URL
        const BASE_URL = window.location.origin;
        document.getElementById('baseUrlInput').value = `${BASE_URL}/api`;

        // Interactive route registry definitions
        const routesData = [
            {
                id: "auth-register",
                category: "Authentication",
                method: "POST",
                path: "/api/register",
                auth: "Public",
                description: "Register a new user account (Admin, Store Owner, or Customer).",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: {
                    "name": "Jane Developer",
                    "email": "janedev@example.com",
                    "password": "securepassword123",
                    "password_confirmation": "securepassword123",
                    "role_id": 2
                },
                response: {
                    "message": "User registered successfully",
                    "user": {
                        "id": 4,
                        "name": "Jane Developer",
                        "email": "janedev@example.com",
                        "role_id": 2,
                        "created_at": "2026-05-31T01:40:00.000000Z"
                    },
                    "token": "4|cba82a87df..."
                }
            },
            {
                id: "auth-login",
                category: "Authentication",
                method: "POST",
                path: "/api/login",
                auth: "Public",
                description: "Authenticate standard credentials to fetch a Sanctum bearer access token.",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: {
                    "email": "owner@gmail.com",
                    "password": "owner1234"
                },
                response: {
                    "token": "5|bd9f82d2f...",
                    "user": {
                        "id": 2,
                        "name": "Store Owner",
                        "email": "owner@gmail.com",
                        "role_id": 30003
                    }
                }
            },
            {
                id: "auth-me",
                category: "Authentication",
                method: "GET",
                path: "/api/users/me",
                auth: "Bearer Token",
                description: "Fetch details of the currently logged-in user profile session.",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                response: {
                    "id": 2,
                    "name": "Store Owner",
                    "email": "owner@gmail.com",
                    "role_id": 30003,
                    "created_at": "2026-05-30T10:00:00.000000Z"
                }
            },
            {
                id: "stores-list",
                category: "Stores Configuration",
                method: "GET",
                path: "/api/stores",
                auth: "Bearer Token (Admin)",
                description: "Admin route to view list of all stores registered in the database system.",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                queryParams: {
                    "created_by": "Optional: Filter stores listing by owner user ID"
                },
                response: [
                    {
                        "id": 1,
                        "name": "Premium Burger Shop",
                        "address": "777 Burger Lane",
                        "subscription_tier": "premium",
                        "custom_domain": "burgers.online.local",
                        "created_by": 2
                    }
                ]
            },
            {
                id: "stores-me",
                category: "Stores Configuration",
                method: "GET",
                path: "/api/stores/me",
                auth: "Bearer Token (Store Owner)",
                description: "Get detail values of the store belonging to the logged-in merchant.",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                response: {
                    "id": 1,
                    "name": "Premium Burger Shop",
                    "address": "777 Burger Lane",
                    "subscription_tier": "premium",
                    "custom_domain": "burgers.online.local",
                    "created_by": 2
                }
            },
            {
                id: "stores-upsert",
                category: "Stores Configuration",
                method: "PUT",
                path: "/api/stores/me",
                auth: "Bearer Token (Store Owner)",
                description: "Create store config if none exists, or update the active layout settings.",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                body: {
                    "name": "Premium Burger Shop (Updated)",
                    "address": "999 Burger Boulevard",
                    "subscription_tier": "premium",
                    "custom_domain": "newburgers.online.local"
                },
                response: {
                    "message": "Store updated successfully",
                    "store": {
                        "id": 1,
                        "name": "Premium Burger Shop (Updated)",
                        "address": "999 Burger Boulevard",
                        "subscription_tier": "premium",
                        "custom_domain": "newburgers.online.local",
                        "created_by": 2
                    }
                }
            },
            {
                id: "categories-list",
                category: "Categories",
                method: "GET",
                path: "/api/categories",
                auth: "Public",
                description: "List all categories in the system.",
                headers: {
                    "Accept": "application/json"
                },
                response: [
                    {
                        "id": 1,
                        "name": "Burgers",
                        "description": "Premium Flame-Grilled Burgers",
                        "image": "http://127.0.0.1:8000/uploads/categories/burgers.png"
                    }
                ]
            },
            {
                id: "categories-create",
                category: "Categories",
                method: "POST",
                path: "/api/categories",
                auth: "Bearer Token (Store Owner)",
                description: "Store a new item category profile.",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                body: {
                    "name": "Soft Drinks",
                    "description": "Ice cold refreshments"
                },
                response: {
                    "id": 4,
                    "name": "Soft Drinks",
                    "description": "Ice cold refreshments",
                    "image": "http://127.0.0.1:8000/uploads/categories/default.png"
                }
            },
            {
                id: "menu-items-list",
                category: "Menu Items",
                method: "GET",
                path: "/api/menu-items",
                auth: "Bearer Token (Store Owner)",
                description: "Get menu items associated with the store owner's catalog.",
                headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                response: [
                    {
                        "id": 210110,
                        "name": "Gourmet Cheeseburger",
                        "price": 9.99,
                        "category_id": 1,
                        "image": "http://127.0.0.1:8000/uploads/menu/burger.png"
                    }
                ]
            },
            {
                id: "menu-items-create",
                category: "Menu Items",
                method: "POST",
                path: "/api/menu-items",
                auth: "Bearer Token (Store Owner)",
                description: "Create a menu item. Supports file uploads for the image.",
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                body: {
                    "name": "Hot Chili Hotdog",
                    "price": "6.49",
                    "category_id": "1",
                    "image": "(Binary File)"
                },
                response: {
                    "id": 210115,
                    "name": "Hot Chili Hotdog",
                    "price": 6.49,
                    "category_id": 1,
                    "image": "http://127.0.0.1:8000/uploads/menu/210115.jpg"
                }
            },
            {
                id: "menu-items-update",
                category: "Menu Items",
                method: "POST",
                path: "/api/menu-items/{item_id}",
                auth: "Bearer Token (Store Owner)",
                description: "Update details of a menu item. When uploading files, POST with route spoofing is recommended.",
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                queryParams: {
                    "item_id": "Required ID of the target menu item"
                },
                body: {
                    "name": "Super Hot Chili Hotdog",
                    "price": "6.99",
                    "category_id": "1",
                    "_method": "PUT"
                },
                response: {
                    "id": 210115,
                    "name": "Super Hot Chili Hotdog",
                    "price": 6.99,
                    "category_id": 1,
                    "image": "http://127.0.0.1:8000/uploads/menu/210115.jpg"
                }
            },
            {
                id: "orders-create",
                category: "Order Management",
                method: "POST",
                path: "/api/orders",
                auth: "Bearer Token (Customer)",
                description: "Place a customer checkout order details payload.",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": "Bearer <token>"
                },
                body: {
                    "items": [
                        { "menu_item_id": 210110, "quantity": 1 }
                    ],
                    "address": "123 Dev Loop Road",
                    "payment_method": "cash"
                },
                response: {
                    "message": "Order created successfully",
                    "order": {
                        "id": 401,
                        "total_amount": 9.99,
                        "status": "pending",
                        "payment_status": "unpaid",
                        "created_by": 3
                    }
                }
            },
            {
                id: "cms-pages-pub",
                category: "CMS (Pages & Posts)",
                method: "GET",
                path: "/api/pages/published",
                auth: "Public",
                description: "List pages with published status for merchant app displays.",
                headers: {
                    "Accept": "application/json"
                },
                response: [
                    {
                        "id": 1,
                        "title": "Terms of Service",
                        "slug": "terms",
                        "content": "Privacy and safety terms...",
                        "is_published": true
                    }
                ]
            },
            {
                id: "system-settings",
                category: "Diagnostics & Assets",
                method: "GET",
                path: "/api/settings",
                auth: "Public",
                description: "Get general store front values settings catalog details.",
                headers: {
                    "Accept": "application/json"
                },
                response: {
                    "id": 1,
                    "site_name": "Premium Food Delivery",
                    "support_email": "support@foodapp.local",
                    "maintenance_mode": false
                }
            },
            {
                id: "health-ping",
                category: "Diagnostics & Assets",
                method: "GET",
                path: "/api/health",
                auth: "Public",
                description: "Return current operational state of database connections.",
                headers: {
                    "Accept": "application/json"
                },
                response: {
                    "status": "Healthy",
                    "database_connection": "Active & Verified",
                    "ssl_tls": "Enabled & Secure"
                }
            }
        ];

        // Active State tracking
        let activeRouteId = null;
        let activeRightTab = 'response'; // response, console, curl, js, python

        // Init page assets
        window.addEventListener('DOMContentLoaded', () => {
            renderSidebar();
            checkServerHealth();
            
            // Format mock response for display initially
            showRouteDetail(null);
        });

        // Theme management
        function toggleTheme() {
            const body = document.body;
            const btn = document.getElementById('themeToggleBtn');
            if (body.classList.contains('light-theme')) {
                body.classList.remove('light-theme');
                btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.add('light-theme');
                btn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                localStorage.setItem('theme', 'light');
            }
        }

        // Apply saved theme preference on load
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-theme');
            document.getElementById('themeToggleBtn').innerHTML = '<i class="fa-solid fa-sun"></i>';
        }

        // Render Navigation Elements
        function renderSidebar() {
            const menu = document.getElementById('endpointsMenu');
            menu.innerHTML = '';

            // Group routes by category
            const categories = {};
            routesData.forEach(route => {
                if (!categories[route.category]) {
                    categories[route.category] = [];
                }
                categories[route.category].push(route);
            });

            // Build menu list
            for (const categoryName in categories) {
                const group = document.createElement('div');
                group.className = 'category-group';
                
                const title = document.createElement('div');
                title.className = 'category-header';
                title.innerHTML = `<span>${categoryName}</span>`;
                group.appendChild(title);

                categories[categoryName].forEach(route => {
                    const item = document.createElement('a');
                    item.className = 'endpoint-item';
                    item.id = `sidebar-item-${route.id}`;
                    item.href = `#`;
                    item.onclick = (e) => {
                        e.preventDefault();
                        showRouteDetail(route.id);
                    };

                    const methodClass = `method-${route.method.toLowerCase()}`;
                    item.innerHTML = `
                        <span class="method-pill ${methodClass}">${route.method}</span>
                        <span class="path-text">${route.path}</span>
                    `;
                    group.appendChild(item);
                });

                menu.appendChild(group);
            }
        }

        // Search endpoint list
        function filterEndpoints() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const items = document.querySelectorAll('.endpoint-item');

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Hide headers if group is empty
            const groups = document.querySelectorAll('.category-group');
            groups.forEach(group => {
                const visibleItems = group.querySelectorAll('.endpoint-item[style="display: flex;"]');
                const header = group.querySelector('.category-header');
                if (visibleItems.length === 0 && query !== '') {
                    header.style.display = 'none';
                } else {
                    header.style.display = 'flex';
                }
            });
        }

        // Toggle Dev Credentials Panel
        function toggleCredentialsChest() {
            const grid = document.getElementById('credentialsGrid');
            const chevron = document.getElementById('chestChevron');
            if (grid.style.display === 'none') {
                grid.style.display = 'grid';
                chevron.className = 'fa-solid fa-chevron-down';
            } else {
                grid.style.display = 'none';
                chevron.className = 'fa-solid fa-chevron-up';
            }
        }

        // Select and display detail structure
        function showRouteDetail(routeId) {
            // Remove active classes
            const previousActive = document.querySelector('.endpoint-item.active');
            if (previousActive) previousActive.classList.remove('active');

            if (!routeId) {
                // Default dashboard state
                document.getElementById('welcomeDocs').style.display = 'block';
                document.getElementById('dynamicDocs').style.display = 'none';
                activeRouteId = null;
                updateRightPanelMockResponse({ "service": "Online Food Ordering API", "status": "Ready", "documentation": "Select a route on the left sidebar to start" });
                return;
            }

            document.getElementById('welcomeDocs').style.display = 'none';
            document.getElementById('dynamicDocs').style.display = 'block';
            
            const route = routesData.find(r => r.id === routeId);
            if (!route) return;

            activeRouteId = routeId;

            // Highlight sidebar
            const sidebarItem = document.getElementById(`sidebar-item-${routeId}`);
            if (sidebarItem) sidebarItem.classList.add('active');

            // Apply detail info
            document.getElementById('routeMethodBadge').className = `route-method method-${route.method.toLowerCase()}`;
            document.getElementById('routeMethodBadge').innerText = route.method;
            document.getElementById('routePathText').innerText = route.path;
            document.getElementById('routeAuthBadge').innerHTML = `
                <i class="fa-solid ${route.auth === 'Public' ? 'fa-lock-open' : 'fa-lock'}"></i>
                <span>${route.auth}</span>
            `;
            document.getElementById('routeDescriptionText').innerText = route.description;

            // Populate Headers
            const headersBody = document.getElementById('headersTableBody');
            headersBody.innerHTML = '';
            for (const key in route.headers) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="param-name">${key}</td>
                    <td><code>${route.headers[key]}</code></td>
                    <td>${key === 'Authorization' ? 'Access token needed for authorization checks.' : 'Target format declaration.'}</td>
                `;
                headersBody.appendChild(tr);
            }

            // Populate Parameters Schema
            const paramsBody = document.getElementById('paramsTableBody');
            const paramsSection = document.getElementById('paramsSection');
            paramsBody.innerHTML = '';

            let hasParams = false;

            // Query parameters
            if (route.queryParams) {
                hasParams = true;
                document.getElementById('paramsSectionTitle').innerHTML = '<i class="fa-solid fa-gears"></i> Query Parameters';
                for (const name in route.queryParams) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td class="param-name">${name}</td>
                        <td><span class="param-type">string</span></td>
                        <td><span class="param-opt">Optional</span></td>
                        <td>${route.queryParams[name]}</td>
                    `;
                    paramsBody.appendChild(tr);
                }
            }

            // JSON Body parameters
            if (route.body && typeof route.body === 'object') {
                hasParams = true;
                document.getElementById('paramsSectionTitle').innerHTML = '<i class="fa-solid fa-code"></i> Request Body (JSON Schema)';
                for (const name in route.body) {
                    const tr = document.createElement('tr');
                    const value = route.body[name];
                    const isRequired = name !== '_method' && name !== 'image';
                    tr.innerHTML = `
                        <td class="param-name">${name}</td>
                        <td><span class="param-type">${typeof value}</span></td>
                        <td>${isRequired ? '<span class="param-req">Required</span>' : '<span class="param-opt">Optional</span>'}</td>
                        <td>Example: <code>${JSON.stringify(value)}</code></td>
                    `;
                    paramsBody.appendChild(tr);
                }
            }

            if (!hasParams) {
                paramsSection.style.display = 'none';
            } else {
                paramsSection.style.display = 'block';
            }

            // Build dynamic input forms in Console
            buildConsoleInputs(route);

            // Update Right Side content based on selection
            updateRightPanelData(route);
        }

        // Build HTML Inputs for try-it-out mode
        function buildConsoleInputs(route) {
            const container = document.getElementById('consoleDynamicInputs');
            container.innerHTML = '';

            // If headers are required, remind them
            if (route.auth !== 'Public') {
                document.getElementById('consoleTokenInput').parentElement.style.display = 'flex';
            } else {
                document.getElementById('consoleTokenInput').parentElement.style.display = 'none';
            }

            // Add Query Inputs
            if (route.queryParams) {
                const section = document.createElement('div');
                section.innerHTML = '<h4 style="font-size:0.8rem; margin: 0.5rem 0; color:var(--text-heading);">Query Params</h4>';
                for (const key in route.queryParams) {
                    const group = document.createElement('div');
                    group.className = 'form-group';
                    group.innerHTML = `
                        <label class="form-label">${key} <span>query</span></label>
                        <input type="text" class="form-input console-query-field" data-key="${key}" placeholder="${route.queryParams[key]}">
                    `;
                    section.appendChild(group);
                }
                container.appendChild(section);
            }

            // Add Body Inputs
            if (route.body) {
                const section = document.createElement('div');
                section.innerHTML = '<h4 style="font-size:0.8rem; margin: 0.5rem 0; color:var(--text-heading);">Request Body</h4>';
                
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label class="form-label">Payload JSON <span>body</span></label>
                    <textarea id="consoleRawJsonBody" class="form-input" rows="8" style="resize:vertical; font-family:'Fira Code', monospace; font-size:0.75rem;">${JSON.stringify(route.body, null, 2)}</textarea>
                `;
                section.appendChild(group);
                container.appendChild(section);
            }
        }

        // Update active code pane
        function updateRightPanelData(route) {
            if (activeRightTab === 'response') {
                updateRightPanelMockResponse(route.response);
            } else {
                updateRightPanelSnippet(route);
            }
        }

        function updateRightPanelMockResponse(data) {
            const block = document.getElementById('responseCodeBlock');
            block.innerHTML = highlightJSON(data);
        }

        function updateRightPanelSnippet(route) {
            const block = document.getElementById('snippetCodeBlock');
            const title = document.getElementById('snippetTitle');
            const fullUrl = `${BASE_URL}${route.path}`;

            let code = '';
            if (activeRightTab === 'curl') {
                title.innerText = 'cURL Request';
                code = `curl -X ${route.method} "${fullUrl}" \\\n`;
                for (const h in route.headers) {
                    code += `  -H "${h}: ${route.headers[h]}" \\\n`;
                }
                if (route.body) {
                    code += `  -d '${JSON.stringify(route.body, null, 2)}'`;
                } else {
                    // Remove trailing backslash
                    code = code.trim().slice(0, -1);
                }
            } else if (activeRightTab === 'js') {
                title.innerText = 'JavaScript Fetch';
                let headersStr = '';
                for (const h in route.headers) {
                    headersStr += `    "${h}": "${route.headers[h]}",\n`;
                }
                code = `const requestOptions = {\n  method: "${route.method}",\n  headers: {\n${headersStr}  }${route.body ? ',\n  body: JSON.stringify(' + JSON.stringify(route.body, null, 2).replace(/\n/g, '\n  ') + ')' : ''}\n};\n\nfetch("${fullUrl}", requestOptions)\n  .then(response => response.json())\n  .then(result => console.log(result))\n  .catch(error => console.error(error));`;
            } else if (activeRightTab === 'python') {
                title.innerText = 'Python Requests';
                let headersStr = '';
                for (const h in route.headers) {
                    headersStr += `    "${h}": "${route.headers[h]}",\n`;
                }
                code = `import requests\n\nurl = "${fullUrl}"\nheaders = {\n${headersStr}}\n${route.body ? 'payload = ' + JSON.stringify(route.body, null, 2) + '\nresponse = requests.' + route.method.toLowerCase() + '(url, json=payload, headers=headers)' : 'response = requests.' + route.method.toLowerCase() + '(url, headers=headers)'}\n\nprint(response.json())`;
            }

            block.innerText = code;
        }

        // Switch Tabs inside Right console pane
        function switchRightTab(tabName) {
            const tabs = ['response', 'console', 'curl', 'js', 'python'];
            tabs.forEach(t => {
                const el = document.getElementById(`tab-${t}`);
                if (el) el.classList.remove('active');
            });

            document.getElementById(`tab-${tabName}`).classList.add('active');
            activeRightTab = tabName;

            const responsePane = document.getElementById('pane-response');
            const consolePane = document.getElementById('pane-console');
            const snippetsPane = document.getElementById('pane-snippets');

            responsePane.style.display = 'none';
            consolePane.style.display = 'none';
            snippetsPane.style.display = 'none';

            if (tabName === 'response') {
                responsePane.style.display = 'flex';
                if (activeRouteId) {
                    const route = routesData.find(r => r.id === activeRouteId);
                    updateRightPanelMockResponse(route.response);
                } else {
                    updateRightPanelMockResponse({ "service": "Online Food Ordering API", "status": "Ready" });
                }
            } else if (tabName === 'console') {
                consolePane.style.display = 'flex';
            } else {
                snippetsPane.style.display = 'flex';
                if (activeRouteId) {
                    const route = routesData.find(r => r.id === activeRouteId);
                    updateRightPanelSnippet(route);
                } else {
                    document.getElementById('snippetCodeBlock').innerText = 'Select a route to display code snippets.';
                }
            }
        }

        // Send actual live REST API request to server
        async function runLiveRequest() {
            if (!activeRouteId) return;
            const route = routesData.find(r => r.id === activeRouteId);
            if (!route) return;

            const resCodeBlock = document.getElementById('consoleResponseCode');
            const statusPill = document.getElementById('consoleStatusPill');
            
            resCodeBlock.innerText = 'Connecting and receiving response...';
            statusPill.style.display = 'none';

            // Resolve dynamic parameters / paths (e.g. {item_id})
            let finalPath = route.path;
            
            // Build query params
            const queryFields = document.querySelectorAll('.console-query-field');
            const queryParams = new URLSearchParams();
            queryFields.forEach(f => {
                const key = f.getAttribute('data-key');
                const val = f.value.trim();
                
                // If it's a path parameter replace it directly
                if (finalPath.includes(`{${key}}`)) {
                    finalPath = finalPath.replace(`{${key}}`, val || '1');
                } else if (val) {
                    queryParams.append(key, val);
                }
            });

            // Ensure route spoof path params like {item_id} inside routes gets resolved even if not in query parameters
            if (finalPath.includes('{item_id}')) {
                finalPath = finalPath.replace('{item_id}', '210110'); // Default ID
            }

            const url = `${BASE_URL}${finalPath}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            // Build request options
            const method = route.method;
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };

            // Inject bearer token if present
            const token = document.getElementById('consoleTokenInput').value.trim();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const requestOptions = {
                method: method,
                headers: headers
            };

            // Build Request Body if needed
            if (method !== 'GET' && method !== 'HEAD') {
                const jsonTextArea = document.getElementById('consoleRawJsonBody');
                if (jsonTextArea) {
                    try {
                        // Validate JSON syntax first
                        JSON.parse(jsonTextArea.value);
                        requestOptions.body = jsonTextArea.value;
                    } catch (e) {
                        resCodeBlock.innerText = `Invalid Request Body JSON syntax: ${e.message}`;
                        return;
                    }
                }
            }

            const startTime = performance.now();
            try {
                const response = await fetch(url, requestOptions);
                const duration = Math.round(performance.now() - startTime);
                
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    data = { "response": await response.text() };
                }

                // Render status pill
                statusPill.style.display = 'inline-block';
                statusPill.innerText = `${response.status} ${response.statusText} (${duration}ms)`;
                statusPill.className = `method-pill ${response.ok ? 'method-get' : 'method-delete'}`;

                // Display highlighted JSON
                resCodeBlock.innerHTML = highlightJSON(data);
            } catch (err) {
                statusPill.style.display = 'inline-block';
                statusPill.innerText = `Connection Refused`;
                statusPill.className = `method-pill method-delete`;
                resCodeBlock.innerText = `Failed to contact API server at: ${url}.\nError: ${err.message}\nMake sure the local server is active (php artisan serve).`;
            }
        }

        // Clear console log
        function clearConsoleResponse() {
            document.getElementById('consoleResponseCode').innerText = 'No request sent yet.';
            document.getElementById('consoleStatusPill').style.display = 'none';
        }

        // Live Health Check query
        async function checkServerHealth() {
            const indicator = document.getElementById('healthIndicator');
            const statusText = document.getElementById('healthStatusText');
            
            statusText.innerText = 'Checking API Health...';
            
            try {
                const response = await fetch(`${BASE_URL}/api/health`);
                if (response.ok) {
                    const data = await response.json();
                    statusText.innerText = `Operational (${data.status})`;
                    indicator.style.color = 'var(--status-green)';
                    indicator.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                    indicator.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                } else {
                    statusText.innerText = 'Degraded';
                    indicator.style.color = 'var(--status-yellow)';
                    indicator.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                    indicator.style.borderColor = 'rgba(245, 158, 11, 0.2)';
                }
            } catch (err) {
                statusText.innerText = 'Offline';
                indicator.style.color = 'var(--status-red)';
                indicator.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                indicator.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }
        }

        // Clipboard utilities
        function copyText(text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast(`Copied: "${text}"`);
            }).catch(err => {
                console.error('Could not copy text: ', err);
            });
        }

        function copyBaseUrl() {
            const baseUrl = document.getElementById('baseUrlInput').value;
            copyText(baseUrl);
        }

        function copyConsoleCode() {
            let activeText = '';
            if (activeRightTab === 'response') {
                activeText = document.getElementById('responseCodeBlock').textContent;
            } else if (activeRightTab === 'curl' || activeRightTab === 'js' || activeRightTab === 'python') {
                activeText = document.getElementById('snippetCodeBlock').textContent;
            }
            if (activeText) {
                copyText(activeText);
            }
        }

        function showToast(message) {
            const toast = document.getElementById('copyToast');
            const textEl = document.getElementById('copyToastText');
            textEl.innerText = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2500);
        }

        function highlightJSON(json) {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, null, 2);
            }
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }
    </script>
</body>
</html>
