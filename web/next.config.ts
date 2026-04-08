import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGhPages
  ? {
      output: "export",
      basePath: "/financial-vault",
      assetPrefix: "/financial-vault/",
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
