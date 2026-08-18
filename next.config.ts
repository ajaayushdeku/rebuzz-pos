import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // There is a stray, empty package-lock.json in the parent directory, and
  // Turbopack infers the workspace root from the nearest lockfile — so it
  // picked the parent and warned. Pinning the root to this directory (the real
  // app) settles it regardless of what sits above.
  turbopack: {
    root: __dirname,
  },
  images: {
    deviceSizes: [640, 768, 1024, 1280],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.beta.rebuzzpos.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "appapi.rebuzzpos.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-popover",
      "recharts",
      "date-fns",
    ],
  },
};

export default nextConfig;
