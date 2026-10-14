import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* the rate page merged into write */
  async redirects() {
    return [{ source: "/rate", destination: "/write", permanent: true }];
  },
};

export default nextConfig;
