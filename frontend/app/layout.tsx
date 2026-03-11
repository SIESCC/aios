import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "AIOS — AI Ecosystem Operating System",
    template: "%s | AIOS",
  },
  description:
    "The central intelligence hub for the global AI ecosystem. Discover, analyze, compare, and track AI tools, models, research papers, startups, and GitHub repositories.",
  keywords: ["AI tools", "AI models", "machine learning", "LLM", "artificial intelligence", "AI research"],
  authors: [{ name: "AIOS Team" }],
  creator: "AIOS",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AIOS — AI Ecosystem Operating System",
    description: "The central intelligence hub for the global AI ecosystem.",
    siteName: "AIOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIOS — AI Ecosystem Operating System",
    description: "The central intelligence hub for the global AI ecosystem.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
