import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { AppInitializer } from "@/components/AppInitializer";
import { SessionTracker } from "@/components/SessionTracker";
import { PageViewTracker } from "@/components/PageViewTracker";

const usageTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_USAGE_TRACKING === "true";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EpiDoc Pilot - Epilepsie Tagebuch",
  description: "Digitales Tagebuch für Epilepsie-Patienten (Pilotprojekt)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${inter.variable} antialiased`}
      >
        <AppInitializer />
        {usageTrackingEnabled && <SessionTracker />}
        {usageTrackingEnabled && <PageViewTracker />}
        <Navbar />
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <ToastContainer />
      </body>
    </html>
  );
}
