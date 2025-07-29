/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
    // Set body size limit to 25MB for Base64 uploads
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

export default config;
