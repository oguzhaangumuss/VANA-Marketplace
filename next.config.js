/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['your-domain.com'], // Eğer harici resim kullanıyorsanız
    // SVG dosyalarını işlemek için webpack konfigürasyonu
    webpack(config) {
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack']
      });
      return config;
    }
  },
}

module.exports = nextConfig 