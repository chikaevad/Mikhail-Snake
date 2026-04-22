import { type NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // reactCompiler: true,
  typescript: {
    // this is checked in the pipeline (CI)
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['your.origin.dev'],
};

export default nextConfig;
