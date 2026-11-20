"use client";

import {
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";

type AccountRole = "customer" | "vendor" | "admin";
type TransactionRole = AccountRole | "unknown";
type TransactionStatus = "paid" | "failed";
type StatusFilter = "all" | TransactionStatus;

type TransactionUser = {
  id: string;
  name: string;
  email: string;
  businessName: string;
  role: TransactionRole;
};

type AdminTransaction = {
  id: string;
  userId: string;
  user: TransactionUser | null;
  stripeInvoiceId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
  amountMinorUnits: number;
  currency: string;
  status: TransactionStatus;
  plan: "premium";
  invoiceNumber: string | null;
  hostedInvoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type TransactionsResponse = {
  success: true;
  transactions: AdminTransaction[];
  pagination: Pagination;
};

type RequestState = {
  key: string;
  transactions: AdminTransaction[] | null;
  pagination: Pagination | null;
  error: string | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All transactions" },
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
];

const statusStyles: Record<TransactionStatus, string> = {
  paid: "bg-emerald-100 text-emerald-900",
  failed: "bg-rose-100 text-rose-900",
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

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isTransactionUser(value: unknown): value is TransactionUser {
  if (!isRecord(value)) {
    return false;
  }

  const validRole =
    value.role === "customer" ||
    value.role === "vendor" ||
    value.role === "admin" ||
    value.role === "unknown";

  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.businessName === "string" &&
    validRole
  );
}

function isAdminTransaction(value: unknown): value is AdminTransaction {
  if (!isRecord(value)) {
    return false;
  }

  const validUser = value.user === null || isTransactionUser(value.user);
  const validStatus = value.status === "paid" || value.status === "failed";

  return (
    typeof value.id === "string" &&
    typeof value.userId === "string" &&
    validUser &&
    typeof value.stripeInvoiceId === "string" &&
    typeof value.stripeSubscriptionId === "string" &&
    isNullableString(value.stripeCustomerId) &&
    typeof value.amountMinorUnits === "number" &&
    Number.isSafeInteger(value.amountMinorUnits) &&
    value.amountMinorUnits >= 0 &&
    typeof value.currency === "string" &&
    validStatus &&
    value.plan === "premium" &&
    isNullableString(value.invoiceNumber) &&
    isNullableString(value.hostedInvoiceUrl) &&
    isNullableString(value.paidAt) &&
    isNullableString(value.createdAt)
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

function isTransactionsResponse(value: unknown): value is TransactionsResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    Array.isArray(value.transactions) &&
    value.transactions.every(isAdminTransaction) &&
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

function formatMoney(amountMinorUnits: number, currency: string): string {
  const normalizedCurrency = currency.toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).format(amountMinorUnits / 100);
  } catch {
    return `${(amountMinorUnits / 100).toFixed(2)} ${normalizedCurrency}`;
  }
}

function getTransactionUserLabel(user: TransactionUser | null): string {
  if (!user) {
    return "Account details unavailable";
  }

  return (
    user.businessName.trim() ||
    user.name.trim() ||
    user.email ||
    "Unnamed account"
  );
}

function getSafeInvoiceUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function AdminTransactionsSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading transactions
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-12 animate-pulse rounded-xl bg-[#eaded8]"
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#eaded8] bg-white p-6"
          >
            <div className="h-5 w-1/3 animate-pulse rounded bg-[#eaded8]" />
            <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-[#f0e8e4]" />
            <div className="mt-5 h-4 w-2/3 animate-pulse rounded bg-[#f0e8e4]" />
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

function AdminTransactionsContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestState, setRequestState] = useState<RequestState>({
    key: "",
    transactions: null,
    pagination: null,
    error: null,
  });

  const queryParams = new URLSearchParams({
    status: statusFilter,
    page: String(page),
    limit: "20",
  });

  if (searchTerm) {
    queryParams.set("search", searchTerm);
  }

  const queryString = queryParams.toString();
  const requestUrl = `${API_BASE_URL}/api/admin/transactions?${queryString}`;
  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${queryString}:${refreshKey}`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/admin/transactions")}`,
      );
      return;
    }

    if (accountRole !== "admin") {
      return;
    }

    const controller = new AbortController();

    async function loadTransactions() {
      try {
        const response = await fetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/admin/transactions")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load transactions (HTTP ${response.status}).`,
          );
        }

        if (!isTransactionsResponse(payload)) {
          throw new Error(
            "The transactions API returned an unexpected response.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          transactions: payload.transactions,
          pagination: payload.pagination,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          transactions: null,
          pagination: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load transactions.",
        });
      }
    }

    void loadTransactions();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "admin" && !hasCurrentResult);
  const transactions = hasCurrentResult
    ? (requestState.transactions ?? [])
    : [];
  const pagination = hasCurrentResult ? requestState.pagination : null;
  const error = hasCurrentResult ? requestState.error : null;

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearchTerm(searchInput.trim());
  }

  function clearFilters() {
    setStatusFilter("all");
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  }

  if (isLoading) {
    return <AdminTransactionsSkeleton />;
  }

  if (!userId || accountRole !== "admin") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <ShieldCheck
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Only admin accounts can view payment transactions.
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
        <CreditCard
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Transactions unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to admin dashboard
      </Link>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Admin workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Transactions
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Review Stripe Premium payment records. Payment status is controlled by
          verified Stripe events and cannot be changed here.
        </p>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="mt-8 grid gap-4 rounded-2xl border border-[#eaded8] bg-white p-5 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor="transactionStatus"
            className="block text-sm font-semibold"
          >
            Payment status
          </label>
          <select
            id="transactionStatus"
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
          <label
            htmlFor="transactionSearch"
            className="block text-sm font-semibold"
          >
            Search
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="transactionSearch"
              type="search"
              maxLength={100}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Invoice, subscription, or account ID"
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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm text-stone-600">
          <Receipt aria-hidden="true" className="h-4 w-4 text-wedplan-rose" />
          {pagination
            ? `${pagination.total} transaction${pagination.total === 1 ? "" : "s"}`
            : "Transactions"}
        </p>

        {(searchTerm || statusFilter !== "all") && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-9 rounded-full border border-[#e3d4cd] px-4 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5]"
          >
            Clear search and filters
          </button>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d9c9c2] bg-white/70 px-6 py-12 text-center">
          <Receipt
            aria-hidden="true"
            className="mx-auto h-8 w-8 text-wedplan-rose"
          />
          <h2 className="mt-4 text-lg font-semibold">No transactions found</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Transactions will appear here after Stripe reports a payment.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {transactions.map((transaction) => {
            const accountLabel = getTransactionUserLabel(transaction.user);
            const invoiceUrl = getSafeInvoiceUrl(transaction.hostedInvoiceUrl);

            return (
              <article
                key={transaction.id}
                className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[transaction.status]}`}
                      >
                        {transaction.status === "paid" ? "Paid" : "Failed"}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">
                        Premium
                      </span>
                    </div>

                    <h2 className="mt-4 break-words text-lg font-semibold">
                      {accountLabel}
                    </h2>

                    <p className="mt-1 break-all text-sm text-stone-600">
                      {transaction.user?.email || transaction.userId}
                    </p>

                    {transaction.user?.role && (
                      <p className="mt-2 text-sm text-stone-600">
                        Account type:{" "}
                        <span className="font-medium capitalize text-wedplan-ink">
                          {transaction.user.role}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 lg:text-right">
                    <p className="text-sm text-stone-600">Amount</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatMoney(
                        transaction.amountMinorUnits,
                        transaction.currency,
                      )}
                    </p>
                    <p className="mt-2 text-sm text-stone-600">
                      {transaction.status === "paid" ? "Paid" : "Recorded"}:{" "}
                      <span className="font-medium text-wedplan-ink">
                        {formatDate(
                          transaction.status === "paid"
                            ? transaction.paidAt
                            : transaction.createdAt,
                        )}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-[#eaded8] pt-5 text-sm text-stone-600 sm:grid-cols-2">
                  <p className="min-w-0">
                    Invoice:{" "}
                    <span className="break-all font-medium text-wedplan-ink">
                      {transaction.invoiceNumber || transaction.stripeInvoiceId}
                    </span>
                  </p>

                  <p className="min-w-0">
                    Subscription:{" "}
                    <span className="break-all font-medium text-wedplan-ink">
                      {transaction.stripeSubscriptionId}
                    </span>
                  </p>

                  <p className="min-w-0 sm:col-span-2">
                    Transaction ID:{" "}
                    <span className="break-all font-medium text-wedplan-ink">
                      {transaction.id}
                    </span>
                  </p>
                </div>

                {invoiceUrl && (
                  <div className="mt-5 border-t border-[#eaded8] pt-5">
                    <a
                      href={invoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
                    >
                      View Stripe invoice
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav
          aria-label="Transaction result pages"
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

export default function AdminTransactionsPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="min-h-[70vh]">
        <Suspense fallback={<AdminTransactionsSkeleton />}>
          <AdminTransactionsContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
