import "./globals.css";
import Providers from "./providers";
import { Sora } from "next/font/google";
import ConditionalFooter from "./ConditionalFooter";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora",
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
      <body 
        className={`min-h-screen overflow-x-hidden antialiased ${sora.variable} font-sans`} 
        style={{ 
          fontFamily: 'var(--font-primary)',
          background: 'var(--paper)',
          color: 'var(--ink)'
        }}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
