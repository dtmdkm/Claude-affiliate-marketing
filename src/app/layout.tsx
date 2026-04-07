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
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0a0a0f] text-slate-100">
        {children}
      </body>
    </html>
  );
}
