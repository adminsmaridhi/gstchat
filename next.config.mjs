const backend = "https://smaridhi-backend.vercel.app";
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://smaridhi-backend.vercel.app/api/:path*",
      },
    ];
  },
};
export default nextConfig;