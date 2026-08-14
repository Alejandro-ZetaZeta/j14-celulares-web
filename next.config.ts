import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async redirects() {
    return [
      { source: "/catalog", destination: "/catalogo", permanent: true },
      { source: "/catalog/:id", destination: "/catalogo/:id", permanent: true },
    ];
  },
};

export default nextConfig;
