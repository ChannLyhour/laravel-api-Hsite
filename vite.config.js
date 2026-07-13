import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

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
            isCloudflare && {
                name: 'copy-favicons',
                closeBundle() {
                    try {
                        if (!fs.existsSync('dist')) {
                            fs.mkdirSync('dist', { recursive: true });
                        }
                        if (fs.existsSync('public/favicon.svg')) {
                            fs.copyFileSync('public/favicon.svg', 'dist/favicon.svg');
                        }
                        if (fs.existsSync('public/favicon.ico')) {
                            fs.copyFileSync('public/favicon.ico', 'dist/favicon.ico');
                        }
                    } catch (e) {
                        console.error('Failed to copy favicons:', e);
                    }
                }
            }
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