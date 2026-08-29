import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deencommerce.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve(__dirname),
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
