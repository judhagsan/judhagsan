/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Evita carregar o barrel file completo de ícones em dev e build.
    optimizePackageImports: ["@primer/octicons-react"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;
