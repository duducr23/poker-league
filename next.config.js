const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  customWorkerSrc: "worker",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = withPWA(nextConfig);
