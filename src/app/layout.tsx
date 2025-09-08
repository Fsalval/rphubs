import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import PWARegistration from "@/components/PWARegistration";

export const metadata: Metadata = {
  title: 'rphubs - Plataforma de Rol Literario',
  description: 'Plataforma de rol literario donde dar vida a tus personajes',
  keywords: ['rol literario', 'roleplay', 'personajes', 'escritura', 'narrativa'],
  authors: [{ name: 'rphubs' }],
  creator: 'rphubs',
  publisher: 'rphubs',
  robots: 'noindex, nofollow',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  colorScheme: 'light dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'rphubs',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'rphubs',
    title: 'rphubs - Plataforma de Rol Literario',
    description: 'Plataforma de rol literario donde dar vida a tus personajes',
  },
  twitter: {
    card: 'summary',
    title: 'rphubs - Plataforma de Rol Literario',
    description: 'Plataforma de rol literario donde dar vida a tus personajes',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegistration />
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
