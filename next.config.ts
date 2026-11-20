import type { NextConfig } from "next";

const apiProxyTarget = (
  process.env.API_PROXY_TARGET || "http://localhost:5000"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
