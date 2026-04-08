import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/financial-vault" : "",
  assetPrefix: isGhPages ? "/financial-vault/" : "",
  images: { unoptimized: true },
};

export default nextConfig;
