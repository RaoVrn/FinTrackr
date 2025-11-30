/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable modern bundling improvements
    esmExternals: true,
  },
}

module.exports = nextConfig;
