import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: {
    default: 'YashCollection – Elegant Ladies\' Kurtis',
    template: '%s | YashCollection',
  },
  description:
    'Discover premium ladies\' kurtis and ethnic wear at YashCollection. Shop the latest styles in comfortable, affordable fashion.',
  keywords: ['kurtis', 'ladies kurtis', 'ethnic wear', 'indian fashion', 'YashCollection'],
  authors: [{ name: 'YashCollection' }],
  creator: 'YashCollection',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://yashcollection.com',
    siteName: 'YashCollection',
    title: 'YashCollection – Elegant Ladies\' Kurtis',
    description: 'Discover premium ladies\' kurtis and ethnic wear at YashCollection.',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'YashCollection' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YashCollection – Elegant Ladies\' Kurtis',
    description: 'Discover premium ladies\' kurtis and ethnic wear at YashCollection.',
    images: ['/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: '#fff', color: '#1f2937', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' },
            success: { iconTheme: { primary: '#db2777', secondary: '#fff' } },
          }}
        />
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
