/** @type {import('next').NextConfig} */

// Importa o next-pwa da forma correta
import nextPWA from 'next-pwa';

// Configura o PWA
const withPWA = nextPWA({
  dest: 'public',
  // futuras configurações do PWA podem ser adicionadas aqui
});

// Envolve sua configuração do Next.js com a configuração do PWA
export default withPWA({
  reactStrictMode: true,
  // outras configurações do Next.js podem ser adicionadas aqui
});