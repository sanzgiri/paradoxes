import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the workspace root so Next doesn't infer a stray parent lockfile
  // (e.g. ~/package-lock.json) as the project root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
