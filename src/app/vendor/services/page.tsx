"use client";

import {
  ArrowLeft,
  Crown,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { SiteFooter } from "@/components/footer";
import { ServiceImageUpload } from "@/components/service-image-upload";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/lib/service-categories";

type AccountRole = "customer" | "vendor" | "admin";
type ServiceStatus = "pending" | "approved" | "rejected";
type ServiceFilter = "all" | ServiceStatus;

type VendorService = {
  _id: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images?: string[];
  status: ServiceStatus;
};

type ServiceListResponse = {
  success: true;
  services: VendorService[];
};

type ServiceRequestState = {
  key: string;
  services: VendorService[] | null;
  error: string | null;
};

type ServiceFormValues = {
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: string;
  location: string;
  images: string[];
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const initialFormValues: ServiceFormValues = {
  serviceName: "",
  category: SERVICE_CATEGORIES[0],
  description: "",
  price: "",
  location: "",
  images: [],
};

const serviceFilters: { value: ServiceFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

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

  const role = value.role;

  if (role === "customer" || role === "vendor" || role === "admin") {
    return role;
  }

  return null;
}

function hasActivePremiumSubscription(value: unknown): boolean {
  if (!isRecord(value) || value.subscriptionPlan !== "premium") {
    return false;
  }

  const expiresAt = value.subscriptionExpiresAt;

  if (expiresAt === undefined || expiresAt === null) {
    return true;
  }

  const expiryTime =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === "string"
        ? Date.parse(expiresAt)
        : typeof expiresAt === "number"
          ? expiresAt
          : Number.NaN;

  return Number.isFinite(expiryTime) && expiryTime > Date.now();
}

function isServiceCategory(value: unknown): value is ServiceCategory {
  return (
    typeof value === "string" &&
    (SERVICE_CATEGORIES as readonly string[]).includes(value)
  );
}

function isServiceStatus(value: unknown): value is ServiceStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

function isVendorService(value: unknown): value is VendorService {
  if (!isRecord(value)) {
    return false;
  }

  const validImages =
    value.images === undefined ||
    (Array.isArray(value.images) &&
      value.images.every((image) => typeof image === "string"));

  return (
    typeof value._id === "string" &&
    typeof value.serviceName === "string" &&
    isServiceCategory(value.category) &&
    typeof value.description === "string" &&
    typeof value.price === "number" &&
    typeof value.location === "string" &&
    validImages &&
    isServiceStatus(value.status)
  );
}

function isServiceListResponse(value: unknown): value is ServiceListResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    Array.isArray(value.services) &&
    value.services.every(isVendorService)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ServiceManagementSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading your services
      </p>

      <div className="h-9 w-64 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 h-10 w-36 animate-pulse rounded-full bg-[#eaded8]" />

      <div className="mt-8 flex flex-wrap gap-2">
        {serviceFilters.map((filter) => (
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
            <div className="mt-4 h-4 w-40 animate-pulse rounded bg-[#f0e8e4]" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-[#f0e8e4]" />
            <div className="mt-3 h-4 w-4/5 animate-pulse rounded bg-[#f0e8e4]" />
            <div className="mt-6 h-10 w-40 animate-pulse rounded-full bg-[#eaded8]" />
          </div>
        ))}
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

function VendorServicesContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);
  const isPremium = hasActivePremiumSubscription(session?.user);

  const [retryKey, setRetryKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ServiceFilter>("all");
  const [requestState, setRequestState] = useState<ServiceRequestState>({
    key: "",
    services: null,
    error: null,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formValues, setFormValues] =
    useState<ServiceFormValues>(initialFormValues);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState("");
  const [billingAction, setBillingAction] = useState<
    "checkout" | "cancel" | null
  >(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingNotice, setBillingNotice] = useState("");
  const [cancellationScheduled, setCancellationScheduled] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(
    null,
  );

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${retryKey}`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
      );
      return;
    }

    if (accountRole !== "vendor") {
      return;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendor/services`, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load services (HTTP ${response.status}).`,
          );
        }

        if (!isServiceListResponse(payload)) {
          throw new Error("The services API returned an unexpected response.");
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
                : "Could not load your services.",
        });
      }
    }

    void loadServices();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "vendor" && !hasCurrentResult);

  const services = hasCurrentResult ? (requestState.services ?? []) : [];
  const error = hasCurrentResult ? requestState.error : null;

  const activeServiceCount = services.filter(
    (service) => service.status === "pending" || service.status === "approved",
  ).length;

  const canAddService = isPremium || activeServiceCount < 3;

  async function handlePremiumCheckout() {
    setBillingAction("checkout");
    setBillingError(null);
    setBillingNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not start checkout (HTTP ${response.status}).`,
        );
      }

      if (
        !isRecord(payload) ||
        payload.success !== true ||
        typeof payload.url !== "string"
      ) {
        throw new Error("The checkout API returned an unexpected response.");
      }

      let checkoutUrl: URL;

      try {
        checkoutUrl = new URL(payload.url);
      } catch {
        throw new Error("Stripe returned an invalid checkout URL.");
      }

      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.stripe.com"
      ) {
        throw new Error("Stripe returned an invalid checkout URL.");
      }

      window.location.assign(checkoutUrl.toString());
    } catch (requestError) {
      setBillingError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not start Premium checkout.",
      );
    } finally {
      setBillingAction(null);
    }
  }

  async function handlePremiumCancellation() {
    const confirmed = window.confirm(
      "Cancel Premium at the end of the current billing period? Your Premium access will remain active until then.",
    );

    if (!confirmed) {
      return;
    }

    setBillingAction("cancel");
    setBillingError(null);
    setBillingNotice("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/stripe/cancel`, {
        method: "POST",
        credentials: "include",
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not cancel Premium (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error(
          "The subscription API returned an unexpected response.",
        );
      }

      setCancellationScheduled(true);
      setBillingNotice(
        typeof payload.message === "string"
          ? payload.message
          : "Premium cancellation is scheduled for the end of the current billing period.",
      );
    } catch (requestError) {
      setBillingError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not cancel Premium.",
      );
    } finally {
      setBillingAction(null);
    }
  }

  function openCreateForm() {
    setEditingServiceId(null);
    setFormValues({ ...initialFormValues });
    setFormError(null);
    setIsFormOpen(true);
    setDeleteTargetId(null);
  }

  function openEditForm(service: VendorService) {
    setEditingServiceId(service._id);
    setFormValues({
      serviceName: service.serviceName,
      category: service.category,
      description: service.description,
      price: String(service.price),
      location: service.location,
      images: service.images ?? [],
    });
    setFormError(null);
    setIsFormOpen(true);
    setDeleteTargetId(null);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingServiceId(null);
    setFormValues({ ...initialFormValues });
    setFormError(null);
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const serviceName = String(formData.get("serviceName") ?? "").trim();
    const categoryValue = formData.get("category");
    const description = String(formData.get("description") ?? "").trim();
    const priceValue = formData.get("price");
    const location = String(formData.get("location") ?? "").trim();

    if (!isServiceCategory(categoryValue)) {
      setFormError("Choose a valid service category.");
      return;
    }

    if (serviceName.length === 0 || serviceName.length > 120) {
      setFormError("Service name must be between 1 and 120 characters.");
      return;
    }

    if (description.length === 0 || description.length > 5000) {
      setFormError("Description must be between 1 and 5000 characters.");
      return;
    }

    if (typeof priceValue !== "string" || priceValue.trim() === "") {
      setFormError("Enter a valid service price.");
      return;
    }

    const price = Number(priceValue);

    if (!Number.isFinite(price) || price < 0) {
      setFormError("Price must be a non-negative number.");
      return;
    }

    if (location.length === 0 || location.length > 200) {
      setFormError("Location must be between 1 and 200 characters.");
      return;
    }

    const images = formValues.images
      .map((image) => image.trim())
      .filter(Boolean);

    if (images.length > 10) {
      setFormError("You can add at most 10 service images.");
      return;
    }

    if (!images.every(isHttpUrl)) {
      setFormError("Each service image must have a valid HTTP or HTTPS URL.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setPageNotice("");

    try {
      const endpoint = editingServiceId
        ? `${API_BASE_URL}/api/vendor/services/${encodeURIComponent(editingServiceId)}`
        : `${API_BASE_URL}/api/vendor/services`;

      const response = await fetch(endpoint, {
        method: editingServiceId ? "PATCH" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceName,
          category: categoryValue,
          description,
          price,
          location,
          images,
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not save service (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error("The services API returned an unexpected response.");
      }

      closeForm();
      setPageNotice(
        editingServiceId ? "Service updated." : "Service submitted for review.",
      );
      setRetryKey((current) => current + 1);
    } catch (requestError) {
      setFormError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not save the service.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    setDeletingServiceId(serviceId);
    setFormError(null);
    setPageNotice("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor/services/${encodeURIComponent(serviceId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/services")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not delete service (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error("The services API returned an unexpected response.");
      }

      setDeleteTargetId(null);
      setPageNotice("Service deleted.");
      setRetryKey((current) => current + 1);
    } catch (requestError) {
      setFormError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not delete the service.",
      );
    } finally {
      setDeletingServiceId(null);
    }
  }

  if (isLoading) {
    return <ServiceManagementSkeleton />;
  }

  if (!userId || accountRole !== "vendor") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Vendor access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Service management is available to vendor accounts.
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
          className="mx-auto h-8 w-8 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Services unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error}</p>
        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    );
  }

  const filteredServices =
    statusFilter === "all"
      ? services
      : services.filter((service) => service.status === statusFilter);

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
            Vendor workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Manage your services
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Create and update your listings. New or edited services are sent for
            review before appearing publicly.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          disabled={!canAddService}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add a service
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#eaded8] bg-white p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-wedplan-ink">
                {isPremium ? "Premium plan" : "Free plan"}
              </p>

              {isPremium && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
                  Premium
                </span>
              )}
            </div>

            <p className="mt-2 text-sm leading-6 text-stone-600">
              {isPremium
                ? `${activeServiceCount} active service${activeServiceCount === 1 ? "" : "s"}. Your plan has no service limit.`
                : `${activeServiceCount} of 3 active services used. Pending and approved listings count toward your free-plan limit.`}
            </p>

            {!isPremium && !canAddService && (
              <p className="mt-2 text-sm font-medium text-wedplan-rose">
                You have reached the free-plan limit. Upgrade to Premium to add
                more services.
              </p>
            )}

            {billingNotice && (
              <p
                role="status"
                className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900"
              >
                {billingNotice}
              </p>
            )}

            {billingError && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
              >
                {billingError}
              </p>
            )}
          </div>

          {!isPremium ? (
            <button
              type="button"
              onClick={() => void handlePremiumCheckout()}
              disabled={billingAction !== null}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Crown aria-hidden="true" className="h-4 w-4" />
              {billingAction === "checkout"
                ? "Opening secure checkout..."
                : "Upgrade to Premium"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handlePremiumCancellation()}
              disabled={billingAction !== null || cancellationScheduled}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {billingAction === "cancel"
                ? "Scheduling cancellation..."
                : cancellationScheduled
                  ? "Cancellation scheduled"
                  : "Cancel at period end"}
            </button>
          )}
        </div>
      </div>

      {pageNotice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {pageNotice}
        </p>
      )}

      {formError && !isFormOpen && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
        >
          {formError}
        </p>
      )}

      {isFormOpen && (
        <form
          id="service-form"
          onSubmit={handleSaveService}
          aria-busy={isSaving}
          className="mt-8 rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {editingServiceId ? "Edit service" : "Add a service"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Fill in the service details for your listing.
              </p>
            </div>

            <button
              type="button"
              aria-label="Close service form"
              onClick={closeForm}
              disabled={isSaving}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e3d4cd] text-stone-600 transition hover:bg-[#f5eae5] disabled:opacity-50"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="serviceName"
                className="block text-sm font-semibold"
              >
                Service name
              </label>
              <input
                id="serviceName"
                name="serviceName"
                type="text"
                required
                maxLength={120}
                value={formValues.serviceName}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    serviceName: event.target.value,
                  }))
                }
                disabled={isSaving}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20 disabled:bg-stone-100"
              />
            </div>

            <div>
              <label
                htmlFor="serviceCategory"
                className="block text-sm font-semibold"
              >
                Category
              </label>
              <select
                id="serviceCategory"
                name="category"
                required
                value={formValues.category}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    category: event.target.value as ServiceCategory,
                  }))
                }
                disabled={isSaving}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20 disabled:bg-stone-100"
              >
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="servicePrice"
                className="block text-sm font-semibold"
              >
                Price in USD
              </label>
              <input
                id="servicePrice"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                value={formValues.price}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    price: event.target.value,
                  }))
                }
                disabled={isSaving}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20 disabled:bg-stone-100"
              />
            </div>

            <div>
              <label
                htmlFor="serviceLocation"
                className="block text-sm font-semibold"
              >
                Service location
              </label>
              <input
                id="serviceLocation"
                name="location"
                type="text"
                required
                maxLength={200}
                value={formValues.location}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    location: event.target.value,
                  }))
                }
                disabled={isSaving}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20 disabled:bg-stone-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="serviceDescription"
                className="block text-sm font-semibold"
              >
                Description
              </label>
              <textarea
                id="serviceDescription"
                name="description"
                required
                rows={5}
                maxLength={5000}
                value={formValues.description}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                disabled={isSaving}
                className="mt-2 w-full resize-y rounded-xl border border-[#e3d4cd] bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20 disabled:bg-stone-100"
              />
            </div>

            <div className="sm:col-span-2">
              <ServiceImageUpload
                value={formValues.images}
                onChange={(images) =>
                  setFormValues((current) => ({
                    ...current,
                    images,
                  }))
                }
                maxImages={10}
              />
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800"
            >
              {formError}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-wedplan-rose px-6 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingServiceId
                  ? "Save changes"
                  : "Submit for review"}
            </button>

            <button
              type="button"
              onClick={closeForm}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e3d4cd] px-6 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div
        role="group"
        aria-label="Filter services by status"
        className="mt-8 flex flex-wrap gap-2"
      >
        {serviceFilters.map((filter) => (
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

      {filteredServices.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9c9c2] bg-white/70 px-6 py-12 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-wedplan-rose"
          />

          <h2 className="mt-4 text-lg font-semibold">
            {services.length === 0
              ? "You have not added any services"
              : "No services match this status"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-600">
            Add a service to start building your vendor listing.
          </p>

          {services.length === 0 && canAddService && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add a service
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {filteredServices.map((service) => {
            const isDeleting = deletingServiceId === service._id;

            return (
              <article
                key={service._id}
                className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-wedplan-rose">
                      {service.category}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      {service.serviceName}
                    </h2>
                  </div>

                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[service.status]}`}
                  >
                    {service.status.charAt(0).toUpperCase() +
                      service.status.slice(1)}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-stone-600">
                  {service.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-600">
                  <span className="inline-flex items-center gap-2">
                    <MapPin
                      aria-hidden="true"
                      className="h-4 w-4 text-wedplan-rose"
                    />
                    {service.location}
                  </span>
                  <span>
                    Price:{" "}
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(service.price)}
                  </span>
                </div>

                {deleteTargetId === service._id ? (
                  <div className="mt-6 rounded-xl bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-900">
                      Delete this service?
                    </p>
                    <p className="mt-1 text-sm leading-6 text-rose-800">
                      This action cannot be undone.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleDeleteService(service._id)}
                        disabled={isDeleting}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-rose-700 px-5 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeleting ? "Deleting..." : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(null)}
                        disabled={isDeleting}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-rose-200 px-5 text-sm font-semibold text-rose-900 transition hover:bg-white disabled:opacity-60"
                      >
                        Keep service
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-[#eaded8] pt-5">
                    <button
                      type="button"
                      onClick={() => openEditForm(service)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(service._id)}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-rose-200 px-5 text-sm font-semibold text-rose-800 transition hover:bg-rose-50"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Delete
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

export default function VendorServicesPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="min-h-[70vh]">
        <Suspense fallback={<ServiceManagementSkeleton />}>
          <VendorServicesContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
