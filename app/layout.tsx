import "./globals.css";
import Providers from "./providers";
import AuthActions from "@/components/AuthActions";
import { Inter } from "next/font/google";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Rekkomo",
  description: "Community platform for Indian migrants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen ${inter.className}`}>
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
              <a className="flex items-center" href="/">
                <Image src="/logo.png" alt="Rekkomo" width={120} height={50} />
              </a>
              <AuthActions />
            </div>
          </header>
          {children}
          <footer className="mt-12 border-t bg-white">
            <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p>© {new Date().getFullYear()} Rekkomo. All rights reserved.</p>
                <nav className="flex flex-wrap items-center gap-4">
                  <a className="hover:text-blue-600" href="/privacy">
                    Privacy Policy
                  </a>
                  <a className="hover:text-blue-600" href="/terms">
                    Terms of Service
                  </a>
                  <a className="hover:text-blue-600" href="/community-guidelines">
                    Community Guidelines
                  </a>
                  <a className="hover:text-blue-600" href="/disclaimer">
                    Disclaimer
                  </a>
                  <a className="hover:text-blue-600" href="/about">
                    About
                  </a>
                  <a className="hover:text-blue-600" href="/contact">
                    Contact
                  </a>
                </nav>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
