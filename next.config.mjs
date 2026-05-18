/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma client and bcryptjs use Node.js built-ins (node:crypto, node:fs, etc.)
  // that webpack cannot bundle. Mark them as server-only externals so Next.js
  // keeps them in the Node.js runtime instead of attempting to bundle them.
  // We also include the custom Prisma output path since it directly imports node:*
  // built-ins at module level.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'bcryptjs'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundles from attempting to resolve Node.js built-ins
      // that Prisma's generated client imports at the top level (node:crypto etc.)
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        os: false,
        module: false,
        url: false,
        process: false,
      }
    }
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}
export default nextConfig
