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
      ->where(function ($query) use ($host) {
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
      'about',
      'restaurants',
      'features',
      'join',
      'pricing',
      'register-owner',
      'admin',
      'owner',
      'shop',
      'product',
      'checkout',
      'profile',
      'wishlist',
      'categories',
      'walkin',
      'static',
      'uploads',
      'build'
    ];

    if (!in_array($storeSlug, $staticPaths)) {
      $storeSetting = \App\Models\Store::where(function ($query) use ($storeSlug) {
        $query->where(function ($q) use ($storeSlug) {
          $q->where('key', 'custom_domain')
            ->where('value', $storeSlug);
        })->orWhere(function ($q) use ($storeSlug) {
          $q->where('key', 'store_name')
            ->where(function ($sq) use ($storeSlug) {
              $storeName = str_replace('_', ' ', $storeSlug);
              $sq->where('value', $storeName)
                ->orWhereRaw('REPLACE(value, " ", "_") = ?', [$storeSlug])
                ->orWhereRaw('LOWER(REPLACE(value, " ", "_")) = ?', [strtolower($storeSlug)]);
            });
        });
      })->first();

      if ($storeSetting) {
        $ownerId = $storeSetting->created_by;
      }
    }
  }

  // 3. If we resolved an ownerId, fetch their store settings for meta tags
  if ($ownerId) {
    $settings = \App\Models\Store::where('created_by', $ownerId)->get()->pluck('value', 'key');

    // Decode JSON settings blocks
    $brandOps = [];
    if ($settings->has('brand_identity_operations')) {
      $brandOps = json_decode($settings->get('brand_identity_operations'), true) ?: [];
    }

    $storeOps = [];
    if ($settings->has('store_operations_content')) {
      $storeOps = json_decode($settings->get('store_operations_content'), true) ?: [];
    }

    // 1. Resolve Store Name
    if (isset($brandOps['store_brand_name']) && $brandOps['store_brand_name']) {
      $metaTitle = $brandOps['store_brand_name'];
    } elseif ($settings->has('store_name')) {
      $metaTitle = $settings->get('store_name');
    }

    // 2. Resolve Description
    if (isset($storeOps['announcement_bar']) && $storeOps['announcement_bar']) {
      $metaDesc = $storeOps['announcement_bar'];
    } elseif (isset($storeOps['footer_copyright']) && $storeOps['footer_copyright']) {
      $metaDesc = $storeOps['footer_copyright'];
    } elseif ($settings->has('announcement_bar') && $settings->get('announcement_bar')) {
      $metaDesc = $settings->get('announcement_bar');
    } elseif ($settings->has('footer_copyright') && $settings->get('footer_copyright')) {
      $metaDesc = $settings->get('footer_copyright');
    } else {
      $metaDesc = "Welcome to " . $metaTitle . "! View our products and catalog online.";
    }

    // 3. Resolve Logo Image
    $logo = null;
    if (isset($brandOps['logo_url']) && !empty($brandOps['logo_url']) && $brandOps['logo_url'] !== 'false') {
      $logo = $brandOps['logo_url'];
    } elseif ($settings->has('logo_url') && !empty($settings->get('logo_url')) && $settings->get('logo_url') !== 'false') {
      $logo = $settings->get('logo_url');
    }

    // Fallback: If no logo is set in store settings, try using the owner's profile image (User model)
    if (empty($logo) || $logo === 'false' || $logo === false) {
      $user = \App\Models\User::find($ownerId);
      if ($user && !empty($user->image) && $user->image !== 'false') {
        $logo = $user->image;
      }
    }

    if ($logo) {
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