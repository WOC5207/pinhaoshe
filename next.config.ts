import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone output (with its file-tracing .nft.json files) is only needed
  // to build the small Docker runtime image — the Dockerfile sets
  // NEXT_STANDALONE=1. Enabling it locally breaks `next dev`/`next start` on
  // Windows when the project lives in OneDrive: OneDrive gives files
  // reparse-point attributes and Node's readlink() then throws EINVAL on the
  // traced files. So only turn it on for the Docker build.
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  serverExternalPackages: ["sharp"],
  // Images are pre-optimized at upload time with sharp and served from the
  // photos volume; the built-in optimizer would re-encode per request (too
  // memory-heavy for a NAS).
  images: { unoptimized: true }
};

export default withNextIntl(nextConfig);
