"use client";

import { Button } from "@heroui/react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  MapPin,
  MessageSquareText,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type AccountRole = "customer" | "vendor" | "admin";
type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";
type BookingFilter = "all" | BookingStatus;
type BookingAction = "cancel" | "accept" | "reject";

type BookingService = {
  _id: string;
  serviceName: string;
  category: string;
  price: number;
  location: string;
};

type ApiBooking = {
  _id: string;
  serviceId: BookingService | null;
  vendorId: string;
  customerId: string;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: BookingStatus;
};

type BookingResponse = {
  success: true;
  bookings: ApiBooking[];
};

type BookingRequestState = {
  key: string;
  bookings: ApiBooking[] | null;
  error: string | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const bookingFilters: { value: BookingFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
  cancelled: "bg-stone-200 text-stone-700",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAccountRole(value: unknown): AccountRole | null {
  if (!isRecord(value)) {
    return null;
  }

  const role = value.role;

  if (role === "customer" || role === "vendor" || role === "admin") {
    return role;
  }

  return null;
}

function isBookingStatus(value: unknown): value is BookingStatus {
  return (
    value === "pending" ||
    value === "accepted" ||
    value === "rejected" ||
    value === "cancelled"
  );
}

function isBookingService(value: unknown): value is BookingService | null {
  if (value === null) {
    return true;
  }

  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    typeof value.serviceName === "string" &&
    typeof value.category === "string" &&
    typeof value.price === "number" &&
    typeof value.location === "string"
  );
}

function isApiBooking(value: unknown): value is ApiBooking {
  return (
    isRecord(value) &&
    typeof value._id === "string" &&
    isBookingService(value.serviceId) &&
    typeof value.vendorId === "string" &&
    typeof value.customerId === "string" &&
    typeof value.eventDate === "string" &&
    typeof value.eventLocation === "string" &&
    typeof value.message === "string" &&
    isBookingStatus(value.status)
  );
}

function isBookingResponse(value: unknown): value is BookingResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    Array.isArray(value.bookings) &&
    value.bookings.every(isApiBooking)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(date);
}

function BookingPageSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading bookings
      </p>

      <div className="h-9 w-64 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 flex flex-wrap gap-2">
        {bookingFilters.map((filter) => (
          <div
            key={filter.value}
            className="h-10 w-24 animate-pulse rounded-full bg-[#eaded8]"
          />
        ))}
      </div>

      <div className="mt-8 grid gap-5">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#eaded8] bg-white p-6"
          >
            <div className="h-6 w-2/3 animate-pulse rounded bg-[#eaded8]" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="h-5 w-4/5 animate-pulse rounded bg-[#f0e8e4]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#f0e8e4]" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-[#f0e8e4]" />
              <div className="h-5 w-1/2 animate-pulse rounded bg-[#f0e8e4]" />
            </div>
            <div className="mt-6 h-10 w-40 animate-pulse rounded-full bg-[#eaded8]" />
          </div>
        ))}
      </div>
    </section>
  );
}

function BookingError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
      <Search
        aria-hidden="true"
        className="mx-auto h-8 w-8 text-wedplan-rose"
      />

      <h1 className="mt-4 text-2xl font-semibold">Bookings unavailable</h1>

      <p className="mt-3 text-sm leading-6 text-stone-600">{message}</p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button
          type="button"
          radius="full"
          onPress={onRetry}
          className="bg-wedplan-rose font-semibold text-white"
        >
          Try again
        </Button>

        <Link
          href="/services"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e3d4cd] bg-white px-5 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Find services
        </Link>
      </div>
    </section>
  );
}

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-20 animate-pulse border-b border-[#eaded8] bg-white"
    />
  );
}

function BookingPageContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);
  const canManageBookings =
    accountRole === "customer" || accountRole === "vendor";

  const [retryKey, setRetryKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<BookingFilter>("all");
  const [requestState, setRequestState] = useState<BookingRequestState>({
    key: "",
    bookings: null,
    error: null,
  });
  const [actionState, setActionState] = useState<{
    bookingId: string;
    action: BookingAction;
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${retryKey}`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent("/bookings")}`);
      return;
    }

    if (!canManageBookings) {
      return;
    }

    const controller = new AbortController();

    async function loadBookings() {
      try {
        const response = await apiFetch(`${API_BASE_URL}/api/bookings`, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/bookings")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load bookings (HTTP ${response.status}).`,
          );
        }

        if (!isBookingResponse(payload)) {
          throw new Error("The booking API returned an unexpected response.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          bookings: payload.bookings,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          bookings: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load bookings.",
        });
      }
    }

    void loadBookings();

    return () => controller.abort();
  }, [canManageBookings, isSessionPending, requestKey, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending || !userId || (canManageBookings && !hasCurrentResult);

  const bookings = hasCurrentResult ? (requestState.bookings ?? []) : [];
  const error = hasCurrentResult ? requestState.error : null;

  async function handleBookingAction(bookingId: string, action: BookingAction) {
    setActionState({ bookingId, action });
    setActionError(null);
    setActionMessage("");

    const isCancelAction = action === "cancel";
    const nextStatus: BookingStatus =
      action === "cancel"
        ? "cancelled"
        : action === "accept"
          ? "accepted"
          : "rejected";

    const endpoint = isCancelAction
      ? `${API_BASE_URL}/api/bookings/${encodeURIComponent(bookingId)}/cancel`
      : `${API_BASE_URL}/api/bookings/${encodeURIComponent(bookingId)}/status`;

    try {
      const response = await apiFetch(endpoint, {
        method: "PATCH",
        credentials: "include",
        ...(isCancelAction
          ? {}
          : {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: nextStatus,
              }),
            }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/bookings")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not update booking (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error("The booking API returned an unexpected response.");
      }

      setRequestState((current) => {
        if (current.key !== requestKey || !current.bookings) {
          return current;
        }

        return {
          ...current,
          bookings: current.bookings.map((booking) =>
            booking._id === bookingId
              ? { ...booking, status: nextStatus }
              : booking,
          ),
        };
      });

      setActionMessage(
        action === "cancel"
          ? "Booking request cancelled."
          : action === "accept"
            ? "Booking request accepted."
            : "Booking request rejected.",
      );
    } catch (requestError) {
      setActionError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not update the booking.",
      );
    } finally {
      setActionState(null);
    }
  }

  if (isLoading) {
    return <BookingPageSkeleton />;
  }

  if (!userId || !canManageBookings) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Bookings unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Bookings are available to customer and vendor accounts.
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
      <BookingError
        message={error}
        onRetry={() => setRetryKey((current) => current + 1)}
      />
    );
  }

  const filteredBookings =
    statusFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.status === statusFilter);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Your wedding plans
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {accountRole === "customer" ? "My bookings" : "Booking requests"}
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          {accountRole === "customer"
            ? "Track your service requests and see the latest responses from vendors."
            : "Review customer requests and respond to pending bookings."}
        </p>
      </div>

      <div
        role="group"
        aria-label="Filter bookings by status"
        className="mt-8 flex flex-wrap gap-2"
      >
        {bookingFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            aria-pressed={statusFilter === filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${
              statusFilter === filter.value
                ? "border-wedplan-rose bg-wedplan-rose text-white"
                : "border-[#e3d4cd] bg-white text-stone-600 hover:bg-[#f5eae5]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {actionError}
        </p>
      )}

      {actionMessage && (
        <p role="status" className="sr-only">
          {actionMessage}
        </p>
      )}

      {filteredBookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9c9c2] bg-white/70 px-6 py-12 text-center">
          <CalendarDays
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-wedplan-rose"
          />

          <h2 className="mt-4 text-lg font-semibold">
            {bookings.length === 0
              ? "No bookings yet"
              : "No bookings match this status"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            {accountRole === "customer"
              ? "When you request a wedding service, your booking will appear here."
              : "New customer booking requests will appear here."}
          </p>

          {accountRole === "customer" && (
            <Link
              href="/services"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Find services
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {filteredBookings.map((booking) => {
            const service = booking.serviceId;
            const isWorking = actionState?.bookingId === booking._id;

            return (
              <article
                key={booking._id}
                className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wedplan-rose">
                      {service?.category ?? "Wedding service"}
                    </p>

                    <h2 className="mt-2 text-xl font-semibold">
                      {service?.serviceName ?? "Service details unavailable"}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[booking.status]}`}
                  >
                    {booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 text-sm text-stone-600 sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <CalendarDays
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-wedplan-rose"
                    />
                    <div>
                      <p className="font-semibold text-wedplan-ink">
                        Event date
                      </p>
                      <p className="mt-1">
                        {formatEventDate(booking.eventDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-wedplan-rose"
                    />
                    <div>
                      <p className="font-semibold text-wedplan-ink">
                        Event location
                      </p>
                      <p className="mt-1">{booking.eventLocation}</p>
                    </div>
                  </div>

                  {service && (
                    <div className="flex items-start gap-2.5">
                      <MapPin
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-wedplan-rose"
                      />
                      <div>
                        <p className="font-semibold text-wedplan-ink">
                          Service area
                        </p>
                        <p className="mt-1">{service.location}</p>
                      </div>
                    </div>
                  )}

                  {service && (
                    <div>
                      <p className="font-semibold text-wedplan-ink">
                        Service price
                      </p>
                      <p className="mt-1">
                        {priceFormatter.format(service.price)}
                      </p>
                    </div>
                  )}
                </div>

                {booking.message && (
                  <div className="mt-5 rounded-xl bg-[#f8f2ef] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-wedplan-ink">
                      <MessageSquareText
                        aria-hidden="true"
                        className="h-4 w-4 text-wedplan-rose"
                      />
                      Message
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-600">
                      {booking.message}
                    </p>
                  </div>
                )}

                {booking.status === "pending" && accountRole === "customer" && (
                  <div className="mt-5 border-t border-[#eaded8] pt-5">
                    <button
                      type="button"
                      disabled={actionState !== null}
                      onClick={() =>
                        void handleBookingAction(booking._id, "cancel")
                      }
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d9c9c2] px-5 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isWorking && actionState?.action === "cancel"
                        ? "Cancelling..."
                        : "Cancel request"}
                    </button>
                  </div>
                )}

                {booking.status === "pending" && accountRole === "vendor" && (
                  <div className="mt-5 flex flex-wrap gap-3 border-t border-[#eaded8] pt-5">
                    <button
                      type="button"
                      disabled={actionState !== null}
                      onClick={() =>
                        void handleBookingAction(booking._id, "accept")
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check aria-hidden="true" className="h-4 w-4" />
                      {isWorking && actionState?.action === "accept"
                        ? "Accepting..."
                        : "Accept"}
                    </button>

                    <button
                      type="button"
                      disabled={actionState !== null}
                      onClick={() =>
                        void handleBookingAction(booking._id, "reject")
                      }
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-rose-200 px-5 text-sm font-semibold text-rose-800 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                      {isWorking && actionState?.action === "reject"
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function BookingsPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="min-h-[70vh]">
        <Suspense fallback={<BookingPageSkeleton />}>
          <BookingPageContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
