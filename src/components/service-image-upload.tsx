"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { apiFetch } from "@/lib/api";

type ServiceImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function getUploadUrl(value: unknown): string | null {
  if (!isRecord(value) || value.success !== true) {
    return null;
  }

  return isHttpsUrl(value.url) ? value.url : null;
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

export function ServiceImageUpload({
  value,
  onChange,
  maxImages = 5,
}: ServiceImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayImages = value
    .map((url, index) => ({ url, index }))
    .filter((image) => isHttpsUrl(image.url));

  async function uploadFiles(files: File[]) {
    if (files.length === 0 || isUploading) {
      return;
    }

    const remainingSlots = maxImages - value.length;

    if (remainingSlots <= 0 || files.length > remainingSlots) {
      setError(`You can upload up to ${maxImages} service images.`);
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !allowedImageTypes.has(file.type) ||
        file.size === 0 ||
        file.size > MAX_IMAGE_SIZE_BYTES,
    );

    if (invalidFile) {
      if (!allowedImageTypes.has(invalidFile.type)) {
        setError("Choose JPEG, PNG, or WebP images.");
      } else {
        setError("Each image must be larger than 0 bytes and 5 MB or smaller.");
      }

      return;
    }

    setError(null);
    setIsUploading(true);

    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);

        const response = await apiFetch(`${API_BASE_URL}/api/uploads`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Image upload failed (HTTP ${response.status}).`,
          );
        }

        const url = getUploadUrl(payload);

        if (!url) {
          throw new Error("The upload API returned an unexpected response.");
        }

        uploadedUrls.push(url);
        onChange([...value, ...uploadedUrls]);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running."
          : uploadError instanceof Error
            ? uploadError.message
            : "Image upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    void uploadFiles(files);
  }

  function removeImage(indexToRemove: number) {
    onChange(value.filter((_, index) => index !== indexToRemove));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-wedplan-ink">
            Service images
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Upload JPEG, PNG, or WebP images. Maximum 5 MB per image.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={isUploading || value.length >= maxImages}
          onChange={handleFileSelection}
          className="sr-only"
          aria-label="Choose service images"
        />

        <button
          type="button"
          disabled={isUploading || value.length >= maxImages}
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus aria-hidden="true" className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Choose images"}
        </button>
      </div>

      <p className="text-xs text-stone-500">
        {value.length} of {maxImages} images
      </p>

      {displayImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {displayImages.map((image) => (
            <div
              key={`${image.url}-${image.index}`}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#eaded8] bg-white"
            >
              <Image
                src={image.url}
                alt={`Service image ${image.index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px"
                className="object-cover"
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() => removeImage(image.index)}
                aria-label={`Remove service image ${image.index + 1}`}
                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-stone-700 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[#d9c9c2] bg-white/70 px-5 py-8 text-center text-sm text-stone-600">
          No service images uploaded yet.
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      )}

      <p aria-live="polite" className="sr-only">
        {isUploading ? "Uploading service images" : ""}
      </p>
    </div>
  );
}
