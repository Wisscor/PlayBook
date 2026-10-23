import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./i18n/request.ts",
});

module.exports = withNextIntl({});


// const createNextIntlPlugin = require("next-intl/plugin");

// const withNextIntl = createNextIntlPlugin({
//   requestConfig: "./i18n/request.ts",
// });

// /** @type {import('next').NextConfig} */
// module.exports = withNextIntl({
//   images: {
//     remotePatterns: [new URL('http://localhost:8000/**')]
//   },
// });

