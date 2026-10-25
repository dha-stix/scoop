/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [
      // Google profile photos
      new URL("https://lh3.googleusercontent.com/**"),
      // CVs, company logos and banners uploaded to Firebase Storage
      new URL("https://firebasestorage.googleapis.com/**"),
    ],
  },
};

export default nextConfig;
