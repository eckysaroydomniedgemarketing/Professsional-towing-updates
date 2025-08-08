import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    RDN_USERNAME: process.env.RDN_USERNAME,
    RDN_PASSWORD: process.env.RDN_PASSWORD,
    RDN_SECURITY_CODE: process.env.RDN_SECURITY_CODE,
  },
};

export default nextConfig;
