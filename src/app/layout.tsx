import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Pharmacy",
  description: "Pharmacy Management System — Inventory, Sales, Expiry Tracking & More",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Global Pharmacy",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
