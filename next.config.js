// Importa o next-pwa
const withPWA = require('next-pwa')({
  dest: 'public'
})

// Envolve sua configuração com o withPWA
/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  // suas outras configurações do next.js podem vir aqui
  reactStrictMode: true,
})

module.exports = nextConfig