@php
    // Determine the host and path
    $host = request()->getHost();
    $path = request()->path(); // e.g. "Our20s" or "Our20s/menu" or "/"
    
    // Fallback defaults
    $metaTitle = "VHsite";
    $metaDesc = "Create and manage your digital restaurant menu and online storefront effortlessly with VHsite.";
    $metaImage = asset('favicon.svg');
    
    // List of root platform domains
    $platformDomains = [
        'localhost',
        '127.0.0.1',
        'lvh.me',
        'store-frontend-v-hsite.vercel.app',
        'vhsite-storefront.vercel.app',
        'vhsite.com',
        'yourplatform.com',
        'laravel-api-hsite.vercel.app',
        'vhsitekh.site',
        'www.vhsitekh.site'
    ];
    
    $ownerId = null;
    
    // 1. Check if the current host is a custom domain
    if (!in_array($host, $platformDomains)) {
        $customDomainSetting = \App\Models\Store::where('key', 'custom_domain')
            ->where(function($query) use ($host) {
                $query->where('value', $host)
                      ->orWhere('value', 'www.' . $host)
                      ->orWhere('value', str_replace('www.', '', $host));
            })
            ->first();
            
        if ($customDomainSetting) {
            $ownerId = $customDomainSetting->created_by;
        }
    }
    
    // 2. If it's a platform domain, parse the first segment of the path as the store slug
    if (!$ownerId && $path && $path !== '/') {
        $segments = explode('/', $path);
        $storeSlug = $segments[0];
        
        // Ignore static paths
        $staticPaths = [
            'about', 'restaurants', 'features', 'join', 'pricing', 'register-owner',
            'admin', 'owner', 'shop', 'product', 'checkout', 'profile', 'wishlist', 'categories', 'walkin', 'static', 'uploads', 'build'
        ];
        
        if (!in_array($storeSlug, $staticPaths)) {
            $storeName = str_replace('_', ' ', $storeSlug);
            $storeNameSetting = \App\Models\Store::where('key', 'store_name')
                ->where(function($q) use ($storeName, $storeSlug) {
                    $q->where('value', $storeName)
                      ->orWhereRaw('REPLACE(value, " ", "_") = ?', [$storeSlug]);
                })
                ->first();
                
            if ($storeNameSetting) {
                $ownerId = $storeNameSetting->created_by;
            }
        }
    }
    
    // 3. If we resolved an ownerId, fetch their store settings for meta tags
    if ($ownerId) {
        $settings = \App\Models\Store::where('created_by', $ownerId)->get()->pluck('value', 'key');
        
        if ($settings->has('store_name')) {
            $metaTitle = $settings->get('store_name');
        }
        
        if ($settings->has('announcement_bar') && $settings->get('announcement_bar')) {
            $metaDesc = $settings->get('announcement_bar');
        } elseif ($settings->has('footer_copyright') && $settings->get('footer_copyright')) {
            $metaDesc = $settings->get('footer_copyright');
        } else {
            $metaDesc = "Welcome to " . $metaTitle . "! View our products and catalog online.";
        }
        
        if ($settings->has('logo_url') && $settings->get('logo_url')) {
            $logo = $settings->get('logo_url');
            if (str_starts_with($logo, 'http://') || str_starts_with($logo, 'https://')) {
                $metaImage = $logo;
            } else {
                $metaImage = url('uploads/' . ltrim($logo, '/'));
            }
        }
    }
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  
  <!-- Primary Meta Tags -->
  <title>{{ $metaTitle }}</title>
  <meta name="title" content="{{ $metaTitle }}" />
  <meta name="description" content="{{ $metaDesc }}" />

  <!-- Open Graph / Facebook / Telegram -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{{ url()->current() }}" />
  <meta property="og:title" content="{{ $metaTitle }}" />
  <meta property="og:description" content="{{ $metaDesc }}" />
  <meta property="og:image" content="{{ $metaImage }}" />

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="{{ url()->current() }}" />
  <meta property="twitter:title" content="{{ $metaTitle }}" />
  <meta property="twitter:description" content="{{ $metaDesc }}" />
  <meta property="twitter:image" content="{{ $metaImage }}" />
  <script>
    // Hide "Download the React DevTools" message in console
    (function () {
      if (typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
          renderers: new Map(),
          supportsFiber: true,
          inject: function () { },
          onCommitFiberRoot: function () { },
          onCommitFiberUnmount: function () { }
        };
      }

      // Explicitly intercept the console.info call used by React
      const originalInfo = console.info;
      console.info = function () {
        if (arguments[0] && typeof arguments[0] === 'string' &&
          arguments[0].includes('Download the React DevTools')) {
          return;
        }
        originalInfo.apply(console, arguments);
      };

      // Intercept the console.debug call used by Vite
      const originalDebug = console.debug;
      console.debug = function () {
        if (arguments[0] && typeof arguments[0] === 'string' &&
          arguments[0].includes('[vite] connected.')) {
          return;
        }
        originalDebug.apply(console, arguments);
      };
    })();
  </script>
  @viteReactRefresh
  @vite(['resources/js/main.tsx'])
</head>

<body class="bg-slate-950 text-slate-300">
  <div id="root"></div>
</body>

</html>