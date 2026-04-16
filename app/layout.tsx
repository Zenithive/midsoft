import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { OptionProvider } from '@/components/layout/OptionContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Navbar } from '@/components/layout/Navbar'

// Only run seed + GPS simulator at runtime, not during build
if (process.env.NODE_ENV !== 'test' && typeof globalThis.__seedInitialised === 'undefined') {
  globalThis.__seedInitialised = true
  import('@/lib/seed').then(({ runSeed }) => {
    try { runSeed() } catch (e) { console.error('[seed] error:', e) }
  })
  import('@/lib/gps-simulator').then(({ startGpsSimulator }) => {
    try { startGpsSimulator() } catch (e) { console.error('[gps] error:', e) }
  })
}

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
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
      className={`${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-slate-50">
        <OptionProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
