/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
}

module.exports = async () => {
  const { default: bundleAnalyzer } = await import('@next/bundle-analyzer')
  const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
  })

  return withBundleAnalyzer(nextConfig)
}
