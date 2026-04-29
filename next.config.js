/** @type {import('next').NextConfig} */

// Permite ajustar caminho de publicação (ex.: GitHub Pages em /repo)
const basePath = process.env.NEXT_BASE_PATH || '';

export default {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  basePath: basePath || undefined,
  // outras configurações do Next.js podem ser adicionadas aqui
};