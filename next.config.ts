import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['mammoth', 'unpdf', 'docx', 'jszip'],
};

export default nextConfig;
