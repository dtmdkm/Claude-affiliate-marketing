import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Affitor Skills — AI-Powered Affiliate Marketing Tools",
  description:
    "52 AI-powered affiliate marketing skills built on Claude. Research niches, write content, build landing pages, and optimize your affiliate business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="antialiased h-full bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
