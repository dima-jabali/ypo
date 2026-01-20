]import { MagicRegExpTransformPlugin } from "magic-regexp/transform";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: false,
  bundlePagesRouterDependencies: false,
  cacheComponents: false,
  productionBrowserSourceMaps: true,
  reactStrictMode: true,
  webpack(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(MagicRegExpTransformPlugin.webpack());
    return config;
  },
};

export default nextConfig;
