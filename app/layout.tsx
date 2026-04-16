import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { OptionProvider } from '@/components/layout/OptionContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

// Only run seed + GPS simulator at runtime, not during build
if (process.env.NODE_ENV !== 'test' && typeof globalThis.__seedInitialised === 'undefined') {
  globalThis.__seedInitialised = true
  // Lazy import to avoid running during static build analysis
  import('@/lib/seed').then(({ runSeed }) => {
    try { runSeed() } catch (e) { console.error('[seed] error:', e) }
  })
  import('@/lib/gps-simulator').then(({ startGpsSimulator }) => {
    try { startGpsSimulator() } catch (e) { console.error('[gps] error:', e) }
  })
}

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
