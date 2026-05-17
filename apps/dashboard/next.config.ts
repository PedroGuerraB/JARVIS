import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@jarvis/db', '@jarvis/shared'],
};

export default nextConfig;
