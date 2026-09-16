const backend = "https://backend-theta-ten-46.vercel.app";
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://backend-theta-ten-46.vercel.app/api/:path*",
      },
    ];
  },
};
export default nextConfig;
