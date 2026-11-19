"use client";

import { ArrowLeft, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";

type AccountRole = "customer" | "vendor" | "admin" | "unknown";
type RoleFilter = "all" | "customer" | "vendor" | "admin";
type StatusFilter = "all" | "active" | "blocked";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  businessName: string;
  isBlocked: boolean;
  emailVerified: boolean;
  image: string | null;
  subscriptionPlan: "free" | "premium";
  subscriptionExpiresAt: string | null;
  createdAt: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminUsersResponse = {
  success: true;
  users: AdminUser[];
  pagination: Pagination;
};

type UserRequestState = {
  key: string;
  users: AdminUser[] | null;
  pagination: Pagination | null;
  error: string | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const roleFilters: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "customer", label: "Customers" },
  { value: "vendor", label: "Vendors" },
  { value: "admin", label: "Admins" },
];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All accounts" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
];

const roleStyles: Record<AccountRole, string> = {
  customer: "bg-sky-100 text-sky-900",
  vendor: "bg-violet-100 text-violet-900",
  admin: "bg-amber-100 text-amber-900",
  unknown: "bg-stone-200 text-stone-700",
};

const subscriptionStyles = {
  free: "bg-stone-100 text-stone-700",
  premium: "bg-amber-100 text-amber-900",
} as const;

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

function isAdminUser(value: unknown): value is AdminUser {
  if (!isRecord(value)) {
    return false;
  }

  const validRole =
    value.role === "customer" ||
    value.role === "vendor" ||
    value.role === "admin" ||
    value.role === "unknown";

  const validImage = value.image === null || typeof value.image === "string";
  const validExpiry =
    value.subscriptionExpiresAt === null ||
    typeof value.subscriptionExpiresAt === "string";
  const validCreatedAt =
    value.createdAt === null || typeof value.createdAt === "string";

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    validRole &&
    typeof value.businessName === "string" &&
    typeof value.isBlocked === "boolean" &&
    typeof value.emailVerified === "boolean" &&
    validImage &&
    (value.subscriptionPlan === "free" ||
      value.subscriptionPlan === "premium") &&
    validExpiry &&
    validCreatedAt
  );
}

function isPagination(value: unknown): value is Pagination {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.page === "number" &&
    Number.isInteger(value.page) &&
    typeof value.limit === "number" &&
    Number.isInteger(value.limit) &&
    typeof value.total === "number" &&
    Number.isInteger(value.total) &&
    typeof value.totalPages === "number" &&
    Number.isInteger(value.totalPages)
  );
}

function isAdminUsersResponse(value: unknown): value is AdminUsersResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    Array.isArray(value.users) &&
    value.users.every(isAdminUser) &&
    isPagination(value.pagination)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function formatRole(role: AccountRole): string {
  if (role === "unknown") {
    return "Unknown role";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getInitials(name: string, email: string): string {
  const source = name.trim() || email;
  const initials = source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

function AdminUsersSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading users
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-12 animate-pulse rounded-xl bg-[#eaded8]"
          />
        ))}
      </div>

      <div className="mt-5 h-12 w-full animate-pulse rounded-xl bg-[#eaded8]" />

      <div className="mt-8 grid gap-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#eaded8] bg-white p-5"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-full bg-[#eaded8]" />
              <div className="flex-1">
                <div className="h-5 w-1/3 animate-pulse rounded bg-[#eaded8]" />
                <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[#f0e8e4]" />
              </div>
              <div className="h-9 w-28 animate-pulse rounded-full bg-[#eaded8]" />
            </div>
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

function AdminUsersContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestState, setRequestState] = useState<UserRequestState>({
    key: "",
    users: null,
    pagination: null,
    error: null,
  });
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState("");

  const queryParams = new URLSearchParams({
    role: roleFilter,
    status: statusFilter,
    page: String(page),
    limit: "20",
  });

  if (searchTerm) {
    queryParams.set("search", searchTerm);
  }

  const queryString = queryParams.toString();
  const requestUrl = `${API_BASE_URL}/api/admin/users?${queryString}`;
  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${queryString}:${refreshKey}`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/admin/users")}`,
      );
      return;
    }

    if (accountRole !== "admin") {
      return;
    }

    const controller = new AbortController();

    async function loadUsers() {
      try {
        const response = await fetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/admin/users")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load users (HTTP ${response.status}).`,
          );
        }

        if (!isAdminUsersResponse(payload)) {
          throw new Error("The user API returned an unexpected response.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          users: payload.users,
          pagination: payload.pagination,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          users: null,
          pagination: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load users.",
        });
      }
    }

    void loadUsers();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "admin" && !hasCurrentResult);
  const users = hasCurrentResult ? (requestState.users ?? []) : [];
  const pagination = hasCurrentResult ? requestState.pagination : null;
  const error = hasCurrentResult ? requestState.error : null;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  }

  function clearFilters() {
    setRoleFilter("all");
    setStatusFilter("all");
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  }

  async function handleUserStatus(user: AdminUser) {
    const nextIsBlocked = !user.isBlocked;

    setActionUserId(user.id);
    setActionError(null);
    setPageNotice("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/users/${encodeURIComponent(user.id)}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isBlocked: nextIsBlocked }),
        },
      );

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/admin/users")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not update account (HTTP ${response.status}).`,
        );
      }

      if (!isRecord(payload) || payload.success !== true) {
        throw new Error("The user API returned an unexpected response.");
      }

      setPageNotice(
        nextIsBlocked
          ? `${user.name || user.email} was blocked.`
          : `${user.name || user.email} was unblocked.`,
      );
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setActionError(
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not update this account.",
      );
    } finally {
      setActionUserId(null);
    }
  }

  if (isLoading) {
    return <AdminUsersSkeleton />;
  }

  if (!userId || accountRole !== "admin") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <Users
          aria-hidden="true"
          className="mx-auto h-8 w-8 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Only admin accounts can manage users.
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
        <h1 className="mt-4 text-2xl font-semibold">Users unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to home
      </Link>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Admin workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Manage users
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Search accounts, filter by role or status, and block or unblock
          accounts.
        </p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-[#eaded8] bg-white p-5 md:grid-cols-3"
      >
        <div>
          <label
            htmlFor="userRoleFilter"
            className="block text-sm font-semibold"
          >
            Role
          </label>
          <select
            id="userRoleFilter"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleFilter);
              setPage(1);
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20"
          >
            {roleFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="userStatusFilter"
            className="block text-sm font-semibold"
          >
            Account status
          </label>
          <select
            id="userStatusFilter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20"
          >
            {statusFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="userSearch" className="block text-sm font-semibold">
            Search
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="userSearch"
              type="search"
              maxLength={100}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Name, email, or business"
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#e3d4cd] bg-white px-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-wedplan-rose focus:ring-2 focus:ring-wedplan-rose/20"
            />
            <button
              type="submit"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-wedplan-rose px-4 text-sm font-semibold text-white transition hover:brightness-95"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      </form>

      {pageNotice && (
        <p
          role="status"
          className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          {pageNotice}
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm text-stone-600">
          <Users aria-hidden="true" className="h-4 w-4 text-wedplan-rose" />
          {pagination
            ? `${pagination.total} account${pagination.total === 1 ? "" : "s"} found`
            : "Accounts"}
        </p>

        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-9 rounded-full border border-[#e3d4cd] px-4 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5]"
          >
            Clear search and filters
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d9c9c2] bg-white/70 px-6 py-12 text-center">
          <Search
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-wedplan-rose"
          />
          <h2 className="mt-4 text-lg font-semibold">No users found</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {users.map((user) => {
            const displayName =
              user.name.trim() || user.email || "Unnamed user";
            const isCurrentUser = user.id === userId;
            const isWorking = actionUserId === user.id;
            const isBlockButtonDisabled =
              actionUserId !== null || (isCurrentUser && !user.isBlocked);

            return (
              <article
                key={user.id}
                className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      aria-hidden="true"
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f5eae5] text-sm font-semibold text-wedplan-rose"
                    >
                      {getInitials(user.name, user.email)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-lg font-semibold">
                          {displayName}
                        </h2>

                        {isCurrentUser && (
                          <span className="rounded-full bg-[#f5eae5] px-2.5 py-1 text-xs font-semibold text-wedplan-ink">
                            You
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-all text-sm text-stone-600">
                        {user.email}
                      </p>

                      {user.businessName && (
                        <p className="mt-2 text-sm text-stone-600">
                          Business:{" "}
                          <span className="font-medium text-wedplan-ink">
                            {user.businessName}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${roleStyles[user.role]}`}
                    >
                      {formatRole(user.role)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        user.isBlocked
                          ? "bg-rose-100 text-rose-900"
                          : "bg-emerald-100 text-emerald-900"
                      }`}
                    >
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${subscriptionStyles[user.subscriptionPlan]}`}
                    >
                      {user.subscriptionPlan === "premium" ? "Premium" : "Free"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-[#eaded8] pt-5 text-sm text-stone-600 sm:grid-cols-2">
                  <p>
                    Joined:{" "}
                    <span className="font-medium text-wedplan-ink">
                      {formatDate(user.createdAt)}
                    </span>
                  </p>

                  <p>
                    Email:{" "}
                    <span
                      className={`font-medium ${
                        user.emailVerified
                          ? "text-emerald-800"
                          : "text-amber-800"
                      }`}
                    >
                      {user.emailVerified ? "Verified" : "Not verified"}
                    </span>
                  </p>

                  {user.subscriptionPlan === "premium" &&
                    user.subscriptionExpiresAt && (
                      <p className="sm:col-span-2">
                        Premium expires:{" "}
                        <span className="font-medium text-wedplan-ink">
                          {formatDate(user.subscriptionExpiresAt)}
                        </span>
                      </p>
                    )}
                </div>

                <div className="mt-5 border-t border-[#eaded8] pt-5">
                  <button
                    type="button"
                    disabled={isBlockButtonDisabled}
                    onClick={() => void handleUserStatus(user)}
                    className={`inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      user.isBlocked
                        ? "border border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        : "border border-rose-200 text-rose-800 hover:bg-rose-50"
                    }`}
                  >
                    {isWorking
                      ? user.isBlocked
                        ? "Unblocking..."
                        : "Blocking..."
                      : user.isBlocked
                        ? "Unblock account"
                        : "Block account"}
                  </button>

                  {isCurrentUser && !user.isBlocked && (
                    <p className="mt-2 text-xs text-stone-500">
                      You cannot block your own admin account.
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="User result pages"
          className="mt-8 flex items-center justify-center gap-4"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="min-h-10 rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-stone-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            className="min-h-10 rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="min-h-[70vh]">
        <Suspense fallback={<AdminUsersSkeleton />}>
          <AdminUsersContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
