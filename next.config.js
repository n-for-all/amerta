/* eslint-disable */
import { withPayload } from "@payloadcms/next/withPayload";
import bundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const url = process.env.NEXT_PUBLIC_SERVER_URL;
const host = new URL(url).host;
const allowSourceMaps = process.env.NODE_ALLOW_SOURCE_MAPS === "true";

const nextConfig = (phase, { defaultConfig }) => {
  const isProdBuild = phase === "phase-production-build";

  const config = withBundleAnalyzer(
    withPayload(
      {
        logging: {
          fetches: {
            fullUrl: !isProdBuild,
          },
        },
        async rewrites() {
          return {
            beforeFiles: [],
            afterFiles: [
              {
                source: "/((?!api/).*)\\.(ico|png|jpg|jpeg|svg|css|js|map)",
                destination: "/api/404",
              },
              {
                source: "/manifest.json",
                destination: "/manifest.webmanifest",
              },
            ],
            fallback: [],
          };
        },
        productionBrowserSourceMaps: allowSourceMaps,
        output: "standalone",
        typescript: {
          ignoreBuildErrors: isProdBuild,
        },
        serverExternalPackages: ["mongodb", "mongoose", "pg", "mysql2", "better-sqlite3", "sqlite3", "nodemailer", "nunjucks"],

        experimental: {
          serverActions: {
            bodySizeLimit: "5mb",
          },
          serverSourceMaps: allowSourceMaps,
          optimizePackageImports: ["lucide-react"],
        },
        env: {
          PAYLOAD_CORE_DEV: "true",
          ROOT_DIR: path.resolve(dirname),
          // @todo remove in 4.0 - will behave like this by default in 4.0
          PAYLOAD_DO_NOT_SANITIZE_LOCALIZED_PROPERTY: "true",
        },
        images: {
          qualities: [75, 100],
          //   domains: [host, "localhost"],
          remotePatterns: [
            {
              protocol: "https",
              hostname: "placehold.co",
            },
            {
              protocol: "https",
              hostname: "images.unsplash.com",
            },
            {
              protocol: "https",
              hostname: "ersalia.com",
            },
            {
              protocol: "http",
              hostname: "*.bstatic.com",
            },
            {
              protocol: "https",
              hostname: "*.bstatic.com",
            },
            {
              protocol: "https",
              hostname: "*.agoda.net",
            },
            {
              protocol: "http",
              hostname: "*.agoda.net",
            },
            {
              protocol: "https",
              hostname: "*.pexels.com",
            },
            {
              protocol: "http",
              hostname: "*.pexels.com",
            },
            {
              protocol: "https",
              hostname: host,
            },
            {
              protocol: "http",
              hostname: host,
            },
            {
              protocol: "https",
              hostname: "localhost",
            },
            {
              protocol: "http",
              hostname: "localhost",
            },
            {
              protocol: "https",
              hostname: "127.0.0.1",
            },
            {
              protocol: "http",
              hostname: "127.0.0.1",
            },
          ],
        },
      },
      { devBundleServerPackages: false },
    ),
  );

  return config;
};

export default nextConfig;
