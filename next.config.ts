import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/client",
    "@libsql/client",
    "@prisma/adapter-libsql",
  ],
};

export default nextConfig;
