import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
    const isCloudflare = mode === 'cloudflare' || process.env.CF_PAGES === '1';

    return {
        plugins: [
            !isCloudflare && laravel({
                input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/main.tsx'],
                refresh: true,
            }),
            react(),
            tailwindcss(),
            isCloudflare && cloudflare()
        ].filter(Boolean),
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './resources/js'),
                '@Security': path.resolve(__dirname, './resources/Security'),
            },
        },
        publicDir: isCloudflare ? false : 'public',
        build: {
            outDir: isCloudflare ? 'dist' : 'public/build',
        },
        server: {
            cors: true,
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});