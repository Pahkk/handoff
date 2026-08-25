import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/processes/[id]/learn": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
