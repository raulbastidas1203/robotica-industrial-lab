import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/robotica-industrial-lab/' : './',
  build: {rollupOptions:{output:{manualChunks:{three:['three'],math:['katex'],react:['react','react-dom']}}}}
});
