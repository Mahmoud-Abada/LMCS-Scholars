const nextConfig = {
  assetPrefix: "/exp1-static",
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],    
  },
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this to handle Node.js modules
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs', 'postgres'],
    optimizePackageImports: ['@workspace/ui'],
    missingSuspenseWithCSRBailout: false,
  },
  // For the database error during build
  skipDatabaseValidation: true
}

export default nextConfig;