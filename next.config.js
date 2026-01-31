/** @type {import('next').NextConfig} */

// Importa o next-pwa da forma correta
import nextPWA from 'next-pwa';

// Configura o PWA
const withPWA = nextPWA({
  dest: 'public',
  // Desabilita o service worker para evitar falhas de fetch no build estático/Capacitor
  disable: true,
  // futuras configurações do PWA podem ser adicionadas aqui
});

// Permite ajustar caminho de publicação (ex.: GitHub Pages em /repo)
const basePath = process.env.NEXT_BASE_PATH || '';

// Envolve sua configuração do Next.js com a configuração do PWA
export default withPWA({
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  basePath: basePath || undefined,
  // outras configurações do Next.js podem ser adicionadas aqui
});