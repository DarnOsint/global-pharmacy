import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";
import { SyncProvider } from "@/components/sync-provider";
import { InstallPrompt } from "@/components/install-prompt";

export const metadata: Metadata = {
  title: "Cyberville Pharmacy POS",
  description: "Cyberville Pharmacy POS — Inventory, Sales, Expiry Tracking & More · Built by Cyberville.tech",
  generator: "Cyberville.tech",
  creator: "Cyberville.tech",
  manifest: "/manifest.json",
  icons: {
    icon: ["/icons/icon-192.png", "/icons/icon.svg"],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cyberville Pharmacy POS",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#04050c" },
    { media: "(prefers-color-scheme: dark)", color: "#04050c" },
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
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <PWAProvider>
          <SyncProvider />
          {children}
        </PWAProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
