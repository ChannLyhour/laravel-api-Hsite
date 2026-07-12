import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
    plugins: [laravel({
        input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/main.tsx'],
        refresh: true,
    }), react(), tailwindcss(), cloudflare()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
            '@Security': path.resolve(__dirname, './resources/Security'),
        },
    },
    server: {
        cors: true,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});