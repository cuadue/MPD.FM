import { defineConfig } from 'vite';
import {faviconsPlugin} from '@darkobits/vite-plugin-favicons';
import react from '@vitejs/plugin-react'

const ICON_PATH = './src/assets/icon.svg';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        minify: false,
        sourcemap: true,
    },
    css: {
        devSourcemap: true,
    },
    plugins: [
        react(),
        faviconsPlugin({
            icons: {
                favicons: { source: ICON_PATH },
                android: { source: ICON_PATH },
                appleIcon: { source: ICON_PATH },
                appleStartup: { source: ICON_PATH },
                windows: { source: ICON_PATH },
            }
        })
    ],
})
