/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
    staleTimes: {
      dynamic: 0,
    },
  },
};

module.exports = nextConfig;