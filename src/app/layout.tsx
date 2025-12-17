import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthProvider from "@/components/auth/provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Toaster } from "sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Artifex Archive",
    template: "%s | Artifex Archive",
  },
  description: "A canonical library for AI-generated media — images, music, video, games, and beyond.",
  keywords: ["AI art", "AI generated", "media library", "synthetic media", "digital archive", "AI images", "AI music", "AI video"],
  authors: [{ name: "Artifex Archive" }],
  creator: "Artifex Archive",
  publisher: "Artifex Archive",
  metadataBase: new URL(
    process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL !== "your_nextauth_url_here"
      ? process.env.NEXTAUTH_URL
      : "http://localhost:3000"
  ),
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Artifex Archive",
    title: "Artifex Archive",
    description: "A canonical library for AI-generated media — images, music, video, games, and beyond.",
    images: [
      {
        url: "/og-image.png", // You'll need to add this image
        width: 1200,
        height: 630,
        alt: "Artifex Archive",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Artifex Archive",
    description: "A canonical library for AI-generated media — images, music, video, games, and beyond.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TRPCProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
            <SpeedInsights />
            <Analytics />
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
