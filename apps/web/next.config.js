/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deencommerce.com",
        pathname: "/wp-content/**",
      },
    ],
  },
};

module.exports = nextConfig;
