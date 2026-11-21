"use client";

import {
  ArrowLeft,
  Check,
  Clock,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteFooter } from "@/components/footer";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type AccountRole = "customer" | "vendor" | "admin";
type ServiceStatus = "pending" | "approved" | "rejected";

type VendorServiceAvailability = {
  id: string;
  serviceName: string;
  category: string;
  location: string;
  status: ServiceStatus;
  isActive: boolean;
};

type AvailabilityResponse = {
  success: true;
  services: VendorServiceAvailability[];
};

type AvailabilityRequestState = {
  key: string;
  services: VendorServiceAvailability[] | null;
  error: string | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const statusStyles: Record<ServiceStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAccountRole(value: unknown): AccountRole | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.role === "customer" ||
    value.role === "vendor" ||
    value.role === "admin"
  ) {
    return value.role;
  }

  return null;
}

function isServiceStatus(value: unknown): value is ServiceStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isVendorServiceAvailability(
  value: unknown,
): value is VendorServiceAvailability {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.category === "string" &&
    typeof value.location === "string" &&
    isServiceStatus(value.status) &&
    typeof value.isActive === "boolean"
  );
}

function isAvailabilityResponse(value: unknown): value is AvailabilityResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    Array.isArray(value.services) &&
    value.services.every(isVendorServiceAvailability)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function AvailabilitySkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading service availability
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 grid gap-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl border border-[#eaded8] bg-white"
          />
        ))}
      </div>
    </section>
  );
}

function VendorAvailabilityContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [retryKey, setRetryKey] = useState(0);
  const [requestState, setRequestState] = useState<AvailabilityRequestState>({
    key: "",
    services: null,
    error: null,
  });
  const [updatingServiceId, setUpdatingServiceId] = useState<string | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${retryKey}`;
  const requestUrl = `${API_BASE_URL}/api/vendor/availability`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/vendor/availability")}`,
      );
      return;
    }

    if (accountRole !== "vendor") {
      return;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        const response = await apiFetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/vendor/availability")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load services (HTTP ${response.status}).`,
          );
        }

        if (!isAvailabilityResponse(payload)) {
          throw new Error(
            "The availability API returned an unexpected response.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          services: payload.services,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          services: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load service availability.",
        });
      }
    }

    void loadServices();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "vendor" && !hasCurrentResult);
  const services = hasCurrentResult ? (requestState.services ?? []) : [];
  const error = hasCurrentResult ? requestState.error : null;
  const activeCount = services.filter(
    (service) => service.status === "approved" && service.isActive,
  ).length;

  async function toggleAvailability(service: VendorServiceAvailability) {
    const nextIsActive = !service.isActive;

    setUpdatingServiceId(service.id);
    setActionError(null);
    setNotice("");

    try {
      const response = await apiFetch(
        `${API_BASE_URL}/api/vendor/availability/${encodeURIComponent(service.id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: nextIsActive }),
        },
      );

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/availability")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not update availability (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error(
          "The availability API returned an unexpected response.",
        );
      }

      setNotice(
        nextIsActive
          ? `${service.serviceName} is available again.`
          : `${service.serviceName} has been paused.`,
      );
      setRetryKey((current) => current + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running."
          : requestError instanceof Error
            ? requestError.message
            : "Could not update service availability.",
      );
    } finally {
      setUpdatingServiceId(null);
    }
  }

  if (isLoading) {
    return <AvailabilitySkeleton />;
  }

  if (!userId || accountRole !== "vendor") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <ShieldCheck
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Vendor access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Service availability is managed by vendor accounts.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <Search
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Availability unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/vendor"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Vendor workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Service availability
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Pause or resume approved services. Only approved services can be
          marked available.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#eaded8] bg-white p-5">
        <p className="text-sm text-stone-600">
          Available services:{" "}
          <span className="font-semibold text-wedplan-ink">
            {activeCount} of {services.length}
          </span>
        </p>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {notice}
        </p>
      )}

      {actionError && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {actionError}
        </p>
      )}

      {services.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d9c9c2] bg-white/70 px-6 py-12 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-wedplan-rose"
          />
          <h2 className="mt-4 text-lg font-semibold">No services yet</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Add a service and wait for approval before changing its
            availability.
          </p>
          <Link
            href="/vendor/services"
            className="mt-5 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
          >
            Manage services
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {services.map((service) => {
            const isUpdating = updatingServiceId === service.id;
            const canToggle = service.status === "approved";

            return (
              <article
                key={service.id}
                className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[service.status]}`}
                    >
                      {service.status.charAt(0).toUpperCase() +
                        service.status.slice(1)}
                    </span>

                    {service.status === "approved" && (
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          service.isActive
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {service.isActive ? "Available" : "Paused"}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 break-words text-lg font-semibold">
                    {service.serviceName}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone-600">
                    {service.category && <span>{service.category}</span>}
                    {service.location && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          aria-hidden="true"
                          className="h-4 w-4 text-wedplan-rose"
                        />
                        {service.location}
                      </span>
                    )}
                    {service.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock
                          aria-hidden="true"
                          className="h-4 w-4 text-wedplan-rose"
                        />
                        Waiting for approval
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-pressed={service.isActive}
                  disabled={!canToggle || updatingServiceId !== null}
                  onClick={() => void toggleAvailability(service)}
                  className={`mt-5 inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 ${
                    service.isActive
                      ? "border border-[#e3d4cd] text-stone-700 hover:bg-[#f5eae5]"
                      : "bg-wedplan-rose text-white hover:brightness-95"
                  }`}
                >
                  {service.isActive ? (
                    <Pause aria-hidden="true" className="h-4 w-4" />
                  ) : (
                    <Play aria-hidden="true" className="h-4 w-4" />
                  )}
                  {isUpdating
                    ? "Updating..."
                    : service.isActive
                      ? "Pause service"
                      : canToggle
                        ? "Resume service"
                        : "Approval required"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {updatingServiceId ? "Updating service availability" : ""}
      </p>

      {services.length > 0 && (
        <p className="mt-5 inline-flex items-center gap-2 text-sm text-stone-600">
          <Check aria-hidden="true" className="h-4 w-4 text-wedplan-rose" />
          Only approved services can be paused or resumed.
        </p>
      )}
    </section>
  );
}

export default function VendorAvailabilityPage() {
  return (
    <div className="flex flex-1 flex-col bg-wedplan-cream text-wedplan-ink">
      <main className="flex-1">
        <Suspense fallback={<AvailabilitySkeleton />}>
          <VendorAvailabilityContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
