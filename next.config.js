/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15: serverExternalPackages substituiu serverComponentsExternalPackages
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
}

module.exports = nextConfig
