import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./i18n/request.ts",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["play-book.dev"],
};

export default withNextIntl(nextConfig);

