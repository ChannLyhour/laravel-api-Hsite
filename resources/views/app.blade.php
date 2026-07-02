<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>VHsite</title>
    <script>
        // Hide "Download the React DevTools" message in console
        (function() {
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
          console.info = function() {
            if (arguments[0] && typeof arguments[0] === 'string' && 
                arguments[0].includes('Download the React DevTools')) {
              return;
            }
            originalInfo.apply(console, arguments);
          };

          // Intercept the console.debug call used by Vite
          const originalDebug = console.debug;
          console.debug = function() {
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
