"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { href: "/home", label: "Feed", icon: "📰" },
  { href: "/jobs", label: "Jobs", icon: "💼" },
  { href: "/services", label: "Services", icon: "🔧" },
  { href: "/events", label: "Events", icon: "🎉" },
  { href: "/community", label: "Community", icon: "👥" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
  };

  return (
    <nav
      className="sticky top-0 z-100 h-14 md:h-16 px-4 md:px-10"
      style={{
        background: "rgba(247,243,238,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" className="flex items-center gap-1.5 md:gap-2.5 no-underline">
        <div
          className="flex items-center gap-1 md:gap-1.5 rounded-[8px] md:rounded-[10px] px-2 md:px-3 py-1.5 md:py-2"
          style={{
            background: "var(--saffron)",
            boxShadow: "0 2px 8px rgba(232,98,26,0.3)",
          }}
        >
          <div
            className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-[6px] md:rounded-[7px] text-xs md:text-sm font-extrabold"
            style={{
              background: "white",
              color: "var(--saffron)",
            }}
          >
            R
          </div>
          <span
            className="text-sm md:text-base font-extrabold tracking-tight hidden sm:inline"
            style={{
              color: "white",
              letterSpacing: "0.06em",
            }}
          >
            REKKOMO
          </span>
        </div>
      </Link>

      {pathname !== "/" && (
        <ul
          className="hidden md:flex items-center gap-1 list-none"
          style={{ gap: "4px" }}
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all no-underline"
                  style={{
                    color: isActive ? "var(--saffron)" : "var(--muted)",
                    background: isActive ? "var(--saffron-light)" : "transparent",
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--saffron-light)";
                      e.currentTarget.style.color = "var(--saffron)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--muted)";
                    }
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2 md:gap-3">
        {session?.user ? (
          <>
            <button
              className="hidden sm:flex px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-semibold border transition-all"
              style={{
                background: "var(--cream)",
                border: "1px solid var(--border)",
                color: "var(--ink)",
                gap: "4px",
              }}
              onClick={() => setLanguage(language === "en" ? "hi" : "en")}
            >
              <span style={{ color: "var(--saffron)" }}>
                {language === "hi" ? "हि" : "EN"}
              </span>
              {language === "hi" ? " / EN" : " / हि"}
            </button>
            <button className="relative p-1.5 md:p-2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
              <span className="text-base md:text-lg">🔔</span>
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full text-white text-xs md:text-sm font-bold transition-transform hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, var(--blue-mid), var(--blue))",
                }}
              >
                {(session.user.name || session.user.username || "U")
                  .split(" ")
                  .map((p) => p[0])
                  .slice(0, 1)
                  .join("")
                  .toUpperCase()}
                <div
                  className="absolute -inset-0.5 rounded-full border-2"
                  style={{
                    borderColor: "var(--saffron)",
                    borderTopColor: "transparent",
                    borderRightColor: "transparent",
                    transform: "rotate(-45deg)",
                  }}
                />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg z-50"
                  style={{
                    borderColor: "var(--border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <div className="py-1">
                    <Link
                      href="/profile/me"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--cream)] transition-colors no-underline"
                    >
                      <span>👤</span>
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors border-none bg-transparent cursor-pointer text-left"
                    >
                      <span>🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/auth/signin"
              className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors no-underline"
            >
              Login
            </Link>
            <Link
              href="/onboarding"
              className="btn-primary text-xs md:text-sm px-3 md:px-5 py-1.5 md:py-2.5 no-underline"
            >
              Join Free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
