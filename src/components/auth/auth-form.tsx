"use client";

import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { SiteHeader } from "../site-header";
import { SiteFooter } from "../footer";

type AuthMode = "sign-in" | "sign-up";
type AccountRole = "customer" | "vendor";

type AuthFormProps = {
  mode: AuthMode;
};

type Feedback = {
  kind: "error" | "success";
  message: string;
};

function getSafeCallbackURL() {
  const params = new URLSearchParams(window.location.search);
  const callbackURL = params.get("callbackURL");

  if (
    !callbackURL ||
    !callbackURL.startsWith("/") ||
    callbackURL.startsWith("//")
  ) {
    return "/services";
  }

  try {
    const destination = new URL(callbackURL, window.location.origin);

    if (destination.origin !== window.location.origin) {
      return "/services";
    }

    if (
      destination.pathname === "/sign-in" ||
      destination.pathname === "/sign-up"
    ) {
      return "/services";
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/services";
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";

  const [role, setRole] = useState<AccountRole>("customer");
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const callbackURL = getSafeCallbackURL();

    try {
      if (isSignUp) {
        const name = String(formData.get("name") ?? "").trim();
        const businessName = String(formData.get("businessName") ?? "").trim();

        const signUpInput = {
          name,
          email,
          password,
          callbackURL,
          role,
          ...(role === "vendor" ? { businessName } : {}),
        };

        const result = await authClient.signUp.email(signUpInput);

        if (result.error) {
          setFeedback({
            kind: "error",
            message: result.error.message || "Could not create your account.",
          });
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL,
        });

        if (result.error) {
          setFeedback({
            kind: "error",
            message: result.error.message || "Could not sign in.",
          });
          return;
        }
      }

      setFeedback({
        kind: "success",
        message: isSignUp
          ? "Your account has been created."
          : "You are signed in.",
      });

      router.replace(callbackURL);
      router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        message:
          "Could not reach the authentication service. Check the API URL and try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setFeedback(null);
    setIsPending(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: getSafeCallbackURL(),
      });

      if (result.error) {
        setFeedback({
          kind: "error",
          message: result.error.message || "Could not continue with Google.",
        });
      }
    } catch {
      setFeedback({
        kind: "error",
        message:
          "Could not reach the authentication service. Check the API URL and try again.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-wedplan-cream text-wedplan-ink">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#eaded8] bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="hidden flex-col justify-between bg-[#f4ebe6] p-10 lg:flex">
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-wedplan-rose text-white">
                <Heart aria-hidden="true" className="h-6 w-6 fill-current" />
              </span>

              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                Wedding planning, made personal
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">
                A thoughtful place to plan your day.
              </h1>

              <p className="mt-4 leading-7 text-stone-600">
                Discover wedding services and keep your planning moving one step
                at a time.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/70 p-4">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-wedplan-rose"
              />
              <p className="text-sm leading-6 text-stone-600">
                Sign in to continue to your WedPlan account.
              </p>
            </div>
          </aside>

          <section aria-labelledby="auth-title" className="p-6 sm:p-10 lg:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
              {isSignUp ? "Create your account" : "Welcome back"}
            </p>

            <h2
              id="auth-title"
              className="mt-3 text-3xl font-semibold tracking-tight"
            >
              {isSignUp ? "Join WedPlan." : "Sign in to WedPlan."}
            </h2>

            <p className="mt-3 text-sm leading-6 text-stone-600">
              {isSignUp
                ? "Create an account to start planning or offer wedding services."
                : "Enter your details to continue planning."}
            </p>

            {feedback && (
              <div
                className={`mt-6 rounded-xl border px-4 py-3 text-sm leading-6 ${
                  feedback.kind === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
                role={feedback.kind === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {feedback.message}
              </div>
            )}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              {isSignUp && (
                <>
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      disabled={isPending}
                      className="min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-wedplan-rose focus:ring-4 focus:ring-[#96575b]/10 disabled:cursor-not-allowed disabled:bg-stone-50"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="mb-2 block text-sm font-medium"
                    >
                      I am joining as
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={role}
                      onChange={(event) =>
                        setRole(
                          event.target.value === "vendor"
                            ? "vendor"
                            : "customer",
                        )
                      }
                      disabled={isPending}
                      className="min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-4 focus:ring-[#96575b]/10 disabled:cursor-not-allowed disabled:bg-stone-50"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>

                  {role === "vendor" && (
                    <div>
                      <label
                        htmlFor="businessName"
                        className="mb-2 block text-sm font-medium"
                      >
                        Business name
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        autoComplete="organization"
                        required
                        disabled={isPending}
                        className="min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-wedplan-rose focus:ring-4 focus:ring-[#96575b]/10 disabled:cursor-not-allowed disabled:bg-stone-50"
                        placeholder="Your business name"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isPending}
                  className="min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-wedplan-rose focus:ring-4 focus:ring-[#96575b]/10 disabled:cursor-not-allowed disabled:bg-stone-50"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={8}
                  required
                  disabled={isPending}
                  className="min-h-12 w-full rounded-xl border border-[#e7d9d2] bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-wedplan-rose focus:ring-4 focus:ring-[#96575b]/10 disabled:cursor-not-allowed disabled:bg-stone-50"
                  placeholder="At least 8 characters"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:bg-[#81484d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
                {!isPending && (
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#eaded8]" />
              <span className="text-xs font-medium uppercase tracking-wider text-stone-400">
                or
              </span>
              <span className="h-px flex-1 bg-[#eaded8]" />
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleGoogleSignIn}
              className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-[#e3d4cd] bg-white px-5 text-sm font-semibold text-wedplan-ink transition hover:bg-[#fffaf7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="grid h-5 w-5 place-items-center rounded-full border border-[#e3d4cd] text-xs font-bold text-wedplan-rose"
              >
                G
              </span>
              Continue with Google
            </button>

            {isSignUp && (
              <p className="mt-3 text-xs leading-5 text-stone-500">
                Google sign-up uses the default role configured by the server.
                Use email sign-up if you want to create a vendor account.
              </p>
            )}

            <p className="mt-7 text-center text-sm text-stone-600">
              {isSignUp ? "Already have an account?" : "New to WedPlan?"}{" "}
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="font-semibold text-wedplan-rose transition hover:text-[#81484d]"
              >
                {isSignUp ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
