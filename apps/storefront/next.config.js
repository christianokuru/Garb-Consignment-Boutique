const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Medusa Cloud-related environment variables
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  ? new URL(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL)
  : null
const BACKEND_HOST = backendUrl?.hostname
const BACKEND_PROTOCOL = backendUrl?.protocol.replace(":", "")

/**
 * Public share links (for demos) that may open the shop and submit its forms.
 * Next.js rejects form submissions and dev assets coming from a web address it
 * doesn't know. Add your own, comma separated, in ALLOWED_ORIGINS.
 */
const SHARE_LINK_HOSTS = [
  "*.trycloudflare.com",
  "*.ngrok-free.app",
  "*.ngrok.app",
  "*.loca.lt",
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((host) => host.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean),
]

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: SHARE_LINK_HOSTS,
  experimental: {
    serverActions: {
      allowedOrigins: SHARE_LINK_HOSTS,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Link", value: '</.well-known/ucp>; rel="ucp"' }],
      },
      {
        source: "/:countryCode/products/:handle",
        headers: [{ key: "Vary", value: "Accept" }],
      },
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:countryCode/products/:handle([^/.]+).md",
          destination: "/:countryCode/products/:handle/markdown",
        },
        {
          source: "/:countryCode/products/:handle([^/.]+)",
          has: [{ type: "header", key: "accept", value: ".*text/markdown.*" }],
          destination: "/:countryCode/products/:handle/markdown",
        },
      ],
    }
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 128, 200, 256, 320, 400],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Next 16 refuses to optimise images served from private IPs. Allow it only
    // when the Medusa backend itself runs on this machine (local development or
    // a local production test); deployed backends have a public hostname.
    dangerouslyAllowLocalIP: ["localhost", "127.0.0.1"].includes(BACKEND_HOST ?? ""),
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      ...(BACKEND_HOST
        ? [
            {
              protocol: BACKEND_PROTOCOL,
              hostname: BACKEND_HOST,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
