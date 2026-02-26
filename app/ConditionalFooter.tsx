"use client";

import { usePathname } from "next/navigation";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Hide footer on auth pages (they have their own footer)
  if (pathname?.startsWith("/auth/")) {
    return null;
  }

  return (
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
  );
}
