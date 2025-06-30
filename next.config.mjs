/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['placeholder.svg'],
    unoptimized: true,
  },
  swcMinify: true,
};

export default nextConfig;
