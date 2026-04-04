import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "ליגת פוקר ♠",
  description: "ניהול ליגת פוקר פרטית — תוצאות, דירוג וסילוקים",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "פוקר ♠",
  },
};

export const viewport: Viewport = {
  themeColor: "#d4a017",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster />
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
