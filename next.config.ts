import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 如果你需要从 EVE Online 的服务器加载图片（比如角色头像），需要配置 images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.evetech.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;