"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const navigationLinks = [
  { label: "Find services", href: "/services" },
  { label: "Categories", href: "/#categories" },
  { label: "How it works", href: "/#how-it-works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const isAuthenticated = Boolean(session?.user);
  const isSignInActive = pathname === "/sign-in";
  const isSignUpActive = pathname === "/sign-up";

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError("");

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setSignOutError(result.error.message || "Could not sign out.");
        return;
      }

      setIsMenuOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      setSignOutError("Could not sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#eaded8]/70 bg-[#fffaf7]/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href="/"
          aria-label="WedPlan home"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-2.5"
        >
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-wedplan-rose text-white">
            <Heart aria-hidden="true" className="h-5 w-5 fill-current" />
          </span>

          <span className="text-xl font-semibold tracking-tight text-wedplan-ink">
            Wed<span className="text-wedplan-rose">Plan</span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-8 md:flex"
        >
          {navigationLinks.map((item) => {
            const isActive =
              item.href === "/services" && pathname.startsWith("/services");

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`text-sm font-medium transition hover:text-wedplan-rose ${
                  isActive ? "text-wedplan-rose" : "text-stone-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!isSessionPending &&
            (isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-full bg-wedplan-rose px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#81484d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  aria-current={isSignInActive ? "page" : undefined}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition hover:text-wedplan-rose ${
                    isSignInActive ? "text-wedplan-rose" : "text-stone-600"
                  }`}
                >
                  Sign in
                </Link>

                <Link
                  href="/sign-up"
                  aria-current={isSignUpActive ? "page" : undefined}
                  className="rounded-full bg-wedplan-rose px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#81484d]"
                >
                  Sign up
                </Link>
              </>
            ))}
        </div>

        <button
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="grid h-10 w-10 place-items-center rounded-full border border-[#eaded8] text-wedplan-ink md:hidden"
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.div
            key="mobile-navigation"
            id="mobile-navigation"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[#eaded8] md:hidden"
          >
            <nav
              aria-label="Mobile navigation"
              className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:px-8"
            >
              {navigationLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-[#f5eae5] hover:text-wedplan-rose"
                >
                  {item.label}
                </Link>
              ))}

              {!isSessionPending && (
                <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[#eaded8] pt-4">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="col-span-2 inline-flex min-h-11 items-center justify-center rounded-full bg-wedplan-rose px-4 text-sm font-semibold text-white transition hover:bg-[#81484d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSigningOut ? "Signing out..." : "Sign out"}
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        aria-current={isSignInActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e3d4cd] px-4 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
                      >
                        Sign in
                      </Link>

                      <Link
                        href="/sign-up"
                        aria-current={isSignUpActive ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-wedplan-rose px-4 text-sm font-semibold text-white transition hover:bg-[#81484d]"
                      >
                        Sign up
                      </Link>
                    </>
                  )}
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {signOutError && (
        <p
          role="alert"
          className="mx-auto max-w-7xl px-5 pb-3 text-right text-sm text-red-700 sm:px-8"
        >
          {signOutError}
        </p>
      )}
    </header>
  );
}
