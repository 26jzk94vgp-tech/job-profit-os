import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/i18n/LanguageContext";
import MobileHeader from "./components/MobileHeader";
import InstallBanner from "./components/InstallBanner";
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';
import DarkModeProvider from './components/DarkModeProvider';

export const metadata: Metadata = {
  title: "CIMO",
  description: "Construction Inventory & Management Optimizer for Australian tradies",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                if (localStorage.getItem('darkMode') === 'true') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <ServiceWorkerRegistrar />
          <DarkModeProvider />
          <MobileHeader />
          <div>
            <InstallBanner />
            <main className="pb-20">
              {children}
            </main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  )
}
