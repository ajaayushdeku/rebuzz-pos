import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
