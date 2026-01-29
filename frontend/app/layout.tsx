import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { ErrorBoundaryWrapper } from "@/components/ErrorBoundaryWrapper";
import { AppInitializer } from "@/components/AppInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EpiDoc - Epilepsie Tagebuch",
  description: "Digitales Tagebuch für Epilepsie-Patienten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppInitializer />
        <ServiceWorkerRegistration />
        <Navbar />
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <ToastContainer />
      </body>
    </html>
  );
}
