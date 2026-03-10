"use client";

import Link from "next/link";
import Image from "next/image";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showUserMenu || showMobileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMobileMenu]);

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    router.push("/");
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-14 md:h-16 px-4 md:px-8 lg:px-10 flex items-center justify-between"
        style={{
          background: "rgba(247,243,238,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-2 md:gap-3">
          {/* Hamburger Menu Button - Mobile Only */}
          {pathname !== "/" && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 -ml-2 text-[var(--ink)] hover:bg-[var(--saffron-light)] rounded-lg transition-colors min-h-11 min-w-11 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <span className="text-xl">{showMobileMenu ? "✕" : "☰"}</span>
            </button>
          )}
          
          <Link href="/" className="flex items-center gap-1.5 md:gap-2.5 no-underline">
            <div
              className="flex items-center gap-1 md:gap-1.5 rounded-[8px] md:rounded-[10px] px-2 md:px-3 py-1.5 md:py-2"
              style={{
                background: "var(--saffron)",
                boxShadow: "0 2px 8px rgba(232,98,26,0.3)",
              }}
            >
              <Image
                src="/logo.png"
                alt="REKKOMO Logo"
                width={28}
                height={28}
                className="h-6 w-6 md:h-7 md:w-7 rounded-[6px] md:rounded-[7px] object-contain"
                priority
              />
              <span
                className="text-sm md:text-base font-extrabold tracking-tight hidden xs:inline"
                style={{
                  color: "white",
                  letterSpacing: "0.06em",
                }}
              >
                REKKOMO
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
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
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all no-underline min-h-11"
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
                className="hidden xs:flex px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-semibold border transition-all min-h-11"
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
              <button className="relative p-1.5 md:p-2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors min-h-11 min-w-11 flex items-center justify-center">
                <span className="text-base md:text-lg">🔔</span>
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full text-white text-xs md:text-sm font-bold transition-transform hover:scale-105 min-h-11 min-w-11"
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
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--ink)] hover:bg-[var(--cream)] transition-colors no-underline min-h-11"
                      >
                        <span>👤</span>
                        Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors border-none bg-transparent cursor-pointer text-left min-h-11"
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
                className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors no-underline min-h-11 flex items-center"
              >
                Login
              </Link>
              <Link
                href="/onboarding"
                className="btn-primary text-xs md:text-sm px-3 md:px-5 py-1.5 md:py-2.5 no-underline min-h-11 flex items-center"
              >
                Join Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {showMobileMenu && pathname !== "/" && (
        <div
          ref={mobileMenuRef}
          className="fixed inset-0 z-40 md:hidden"
          style={{ 
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div
            className="absolute top-14 left-0 right-0 bg-white border-b shadow-lg"
            style={{ borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="flex flex-col list-none py-2">
              {NAV_LINKS.map((link) => {
                const isActive = pathname?.startsWith(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors no-underline min-h-11"
                      style={{
                        color: isActive ? "var(--saffron)" : "var(--ink)",
                        background: isActive ? "var(--saffron-light)" : "transparent",
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{link.icon}</span>
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
