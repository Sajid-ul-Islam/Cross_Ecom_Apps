/** @type {import('next').NextConfig} */
const nextConfig = {
  // The web app lives alongside apps/mobile which has a babel.config.js.
  // Babel walks up and finds it, so SWC is disabled and Babel is used.
  // @babel/runtime is installed in the web app to satisfy Babel's needs.
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
