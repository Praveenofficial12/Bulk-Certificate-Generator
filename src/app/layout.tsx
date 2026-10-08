import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bulk Certificate Generator — Create, manage and deliver hundreds of certificates in minutes.",
  description:
    "Create, process, track, and download bulk certificates with a simple and powerful certificate generation platform.",
  keywords: [
    "certificate generator",
    "bulk certificates",
    "PDF certificates",
    "event certificates",
    "corporate certificates",
  ],
  authors: [{ name: "Bulk Certificate Generator" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Bulk Certificate Generator",
    description: "Create, manage and deliver hundreds of certificates in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster richColors closeButton position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
