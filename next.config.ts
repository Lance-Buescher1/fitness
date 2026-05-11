import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Directory that contains this config file (the Next.js app root). Stops Turbopack from treating a parent `package-lock.json` (e.g. in `$HOME`) as the workspace root. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
