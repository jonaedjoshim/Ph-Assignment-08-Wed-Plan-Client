"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

type AccountRole = "customer" | "vendor" | "admin";

type ProfileLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navigationLinks = [
  { label: "Find services", href: "/services" },
  { label: "Categories", href: "/#categories" },
  { label: "How it works", href: "/#how-it-works" },
];

const dashboardHrefByRole: Record<AccountRole, string> = {
  customer: "/customer",
  vendor: "/vendor",
  admin: "/admin",
};

function getAccountRole(value: unknown): AccountRole | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const role = (value as Record<string, unknown>).role;

  if (role === "customer" || role === "vendor" || role === "admin") {
    return role;
  }

  return null;
}

function getStringField(value: unknown, key: string): string {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === "string" ? field : "";
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

function getProfileLinks(role: AccountRole | null): ProfileLink[] {
  const links: ProfileLink[] = [];

  if (role) {
    links.push({
      label: "Dashboard",
      href: dashboardHrefByRole[role],
      icon: LayoutDashboard,
    });
  }

  if (role === "vendor") {
    links.push({
      label: "Subscription",
      href: "/vendor/subscription",
      icon: Crown,
    });
  }

  links.push({
    label: "Profile settings",
    href: "/settings/profile",
    icon: Settings,
  });

  return links;
}

function ProfileAvatar({ name, image }: { name: string; image: string }) {
  if (image) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#f5eae5]">
        <Image
          src={image}
          alt=""
          fill
          sizes="36px"
          unoptimized
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-wedplan-rose text-xs font-semibold text-white"
    >
      {getInitials(name)}
    </span>
  );
}

function ProfileMenu({
  name,
  image,
  role,
  isSigningOut,
  onSignOut,
}: {
  name: string;
  image: string;
  role: AccountRole | null;
  isSigningOut: boolean;
  onSignOut: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileLinks = getProfileLinks(role);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile menu"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-3 rounded-full border border-[#eaded8] bg-white py-1.5 pl-1.5 pr-4 transition hover:border-[#d9c4bb]"
      >
        <ProfileAvatar name={name} image={image} />
        <span className="max-w-[10rem] truncate text-sm font-semibold text-wedplan-ink">
          {name}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-3 w-64 overflow-hidden rounded-2xl border border-[#eaded8] bg-white shadow-lg"
        >
          <div className="border-b border-[#eaded8] px-4 py-3">
            <p className="truncate text-sm font-semibold text-wedplan-ink">
              {name}
            </p>
            <p className="text-xs capitalize text-stone-500">
              {role ?? "account"}
            </p>
          </div>

          <div className="py-2">
            {profileLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-[#f5eae5] hover:text-wedplan-rose"
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-[#eaded8] py-2">
            <button
              type="button"
              role="menuitem"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {isSigningOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const isAuthenticated = Boolean(session?.user);
  const role = getAccountRole(session?.user);
  const canOpenBookings = role === "customer" || role === "vendor";
  const userName =
    getStringField(session?.user, "name") ||
    getStringField(session?.user, "email") ||
    "Account";
  const userImage = getStringField(session?.user, "image");
  const profileLinks = getProfileLinks(role);

  const visibleNavigationLinks = [
    ...navigationLinks,
    ...(canOpenBookings ? [{ label: "My bookings", href: "/bookings" }] : []),
    ...(role === "vendor"
      ? [{ label: "Manage services", href: "/vendor/services" }]
      : []),
    ...(role === "admin"
      ? [
          { label: "Review services", href: "/admin/services" },
          { label: "Manage users", href: "/admin/users" },
        ]
      : []),
  ];

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
          className="hidden items-center gap-5 xl:flex"
        >
          {visibleNavigationLinks.map((item) => {
            const isActive =
              (item.href === "/services" && pathname.startsWith("/services")) ||
              (item.href === "/bookings" && pathname.startsWith("/bookings")) ||
              (item.href === "/vendor/services" &&
                pathname.startsWith("/vendor/services")) ||
              (item.href === "/admin/services" &&
                pathname.startsWith("/admin/services")) ||
              (item.href === "/admin/users" &&
                pathname.startsWith("/admin/users"));

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

        <div className="hidden items-center gap-3 xl:flex">
          {!isSessionPending &&
            (isAuthenticated ? (
              <ProfileMenu
                name={userName}
                image={userImage}
                role={role}
                isSigningOut={isSigningOut}
                onSignOut={handleSignOut}
              />
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
          className="grid h-10 w-10 place-items-center rounded-full border border-[#eaded8] text-wedplan-ink xl:hidden"
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
            className="overflow-hidden border-t border-[#eaded8] xl:hidden"
          >
            <nav
              aria-label="Mobile navigation"
              className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:px-8"
            >
              {visibleNavigationLinks.map((item) => {
                const isActive =
                  (item.href === "/services" &&
                    pathname.startsWith("/services")) ||
                  (item.href === "/bookings" &&
                    pathname.startsWith("/bookings")) ||
                  (item.href === "/vendor/services" &&
                    pathname.startsWith("/vendor/services")) ||
                  (item.href === "/admin/services" &&
                    pathname.startsWith("/admin/services")) ||
                  (item.href === "/admin/users" &&
                    pathname.startsWith("/admin/users"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-xl px-3 py-3 text-sm font-medium transition hover:bg-[#f5eae5] hover:text-wedplan-rose ${
                      isActive ? "text-wedplan-rose" : "text-stone-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {!isSessionPending &&
                (isAuthenticated ? (
                  <div className="mt-2 border-t border-[#eaded8] pt-4">
                    <div className="flex items-center gap-3 px-3 pb-3">
                      <ProfileAvatar name={userName} image={userImage} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-wedplan-ink">
                          {userName}
                        </p>
                        <p className="text-xs capitalize text-stone-500">
                          {role ?? "account"}
                        </p>
                      </div>
                    </div>

                    {profileLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-[#f5eae5] hover:text-wedplan-rose"
                        >
                          <Icon aria-hidden="true" className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-wedplan-rose px-4 text-sm font-semibold text-white transition hover:bg-[#81484d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      {isSigningOut ? "Signing out..." : "Logout"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[#eaded8] pt-4">
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
                  </div>
                ))}
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
