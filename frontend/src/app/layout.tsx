import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/ui/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CortexAI - Enterprise Generative AI Orchestration Platform",
  description: "Accelerate system building with production-ready multi-node RAG, low-latency semantic vector search, and dynamic cognitive reasoning agents containerized for massive enterprise scale.",
  keywords: ["Generative AI", "Vector Space Embeddings", "Retrieval-Augmented Generation", "RAG Simulator", "Enterprise AI", "Three.js Machine Learning"],
  authors: [{ name: "CortexAI Team" }],
  openGraph: {
    title: "CortexAI - Enterprise Generative AI Orchestration Platform",
    description: "Accelerate system building with production-ready multi-node RAG, low-latency semantic vector search, and dynamic cognitive reasoning agents.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#020205] text-[#f3f4f6]">
        {/* Lagging Cursor Aura */}
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
