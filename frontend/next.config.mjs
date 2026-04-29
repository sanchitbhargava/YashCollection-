/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com', 'res.cloudinary.com', 'via.placeholder.com'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
};
export default nextConfig;
