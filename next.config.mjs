import { MagicRegExpTransformPlugin } from 'magic-regexp/transform'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactCompiler: true,
  webpack(config) {
    config.plugins = config.plugins || []
    config.plugins.push(MagicRegExpTransformPlugin.webpack())
    return config
  }
};

export default nextConfig;
