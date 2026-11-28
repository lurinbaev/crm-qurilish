import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${backendOrigin}/api/v1/:path*` },
      { source: "/docs/:path*", destination: `${backendOrigin}/docs/:path*` },
      { source: "/openapi.json", destination: `${backendOrigin}/openapi.json` },
      { source: "/redoc", destination: `${backendOrigin}/redoc` },
    ];
  },
};

export default nextConfig;
