/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    domains: ["stellar.expert"]
  },
  async rewrites() {
    return [{ source: "/api/assets/:path*", destination: "https://stellar.beign.es/:path*" }];
  }
};
