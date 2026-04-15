import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { runSeed } from '@/lib/seed'
import { OptionProvider } from '@/components/layout/OptionContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'
import { startGpsSimulator } from '@/lib/gps-simulator'

// Run seed data on server startup
runSeed()

// Start GPS simulator
startGpsSimulator()

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waste Route Optimisation Platform",
  description: "Next.js 14+ prototype demonstrating route optimisation for waste management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <OptionProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </OptionProvider>
      </body>
    </html>
  );
}
