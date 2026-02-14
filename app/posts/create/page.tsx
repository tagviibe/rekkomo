"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlinePhoto,
} from "react-icons/hi2";

const TYPE_MAP: Record<string, string> = {
  Help: "HELP",
  Housing: "RESOURCE",
  Job: "QUESTION",
  Event: "GENERAL",
  Service: "RESOURCE",
  Story: "GENERAL",
};

const types = ["Help", "Housing", "Job", "Event", "Service", "Story"];
const TAG_SUGGESTIONS = [
  "housing",
  "visa",
  "docs",
  "jobs",
  "tiffin",
  "movers",
  "local services",
  "roommates",
  "legal",
  "education",
];

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type") ?? "Help";
  const type = types.includes(selectedType) ? selectedType : "Help";
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { register, watch, setValue, getValues } = useForm({
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      anonymous: false,
      contact: "DM",
      housingMode: "Looking",
      rent: "",
      moveIn: "",
      preferences: "",
      jobRole: "",
      company: "",
      remote: "Onsite",
      referral: "Referral",
      requirements: "",
      eventDate: "",
      fee: "Free",
      serviceCategory: "",
      priceRange: "",
    },
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `/api/geo/reverse?lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.label) {
              setLocation(data.label);
              return;
            }
          }
        } catch {
          // ignore
        }
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  const formValues = watch();
  const composed = useMemo(() => {
    let title = formValues.title;
    let description = formValues.description;
    if (type === "Housing") {
      title = title || `${formValues.housingMode} housing`;
      description = [
        formValues.description,
        formValues.rent && `Budget: ${formValues.rent}`,
        formValues.moveIn && `Move-in: ${formValues.moveIn}`,
        formValues.preferences && `Prefs: ${formValues.preferences}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (type === "Job") {
      title =
        title || `${formValues.jobRole || "Job"} at ${formValues.company || "Company"}`;
      description = [
        formValues.description,
        formValues.remote && `Mode: ${formValues.remote}`,
        formValues.referral && `Type: ${formValues.referral}`,
        formValues.requirements && `Requirements: ${formValues.requirements}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (type === "Event") {
      title = title || "Community event";
      description = [
        formValues.description,
        formValues.eventDate && `When: ${formValues.eventDate}`,
        formValues.fee && `Fee: ${formValues.fee}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    if (type === "Service") {
      title = title || formValues.serviceCategory || "Service";
      description = [
        formValues.description,
        formValues.priceRange && `Price: ${formValues.priceRange}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return { title: title.trim(), body: description.trim() };
  }, [formValues, type]);

  const canPublish = composed.title.length >= 3 && composed.body.length >= 10;

  const publish = async () => {
    if (!canPublish) return;
    setLoading(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "post");
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Image upload failed");
        }
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const values = getValues();
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: TYPE_MAP[type] ?? "GENERAL",
          title: composed.title,
          body: composed.body,
          tags: values.tags
            ? values.tags.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          imageUrl,
          locationContext: location || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Publish failed");
      }
      setToast("Post published");
      setTimeout(() => {
        router.push("/home");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="flex items-center gap-3">
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => router.back()}
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Create {type} post</h1>
      </header>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span className="flex items-center gap-2 rounded-full border px-3 py-1">
            <HiOutlineMapPin className="text-slate-500" />
            {location || "Set location"}
          </span>
          <span className="flex items-center gap-2 rounded-full border px-3 py-1">
            <HiOutlineChatBubbleLeftEllipsis className="text-slate-500" />
            Contact: {formValues.contact}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-lg border p-2 text-sm"
            placeholder="Title"
            {...register("title")}
          />
          <textarea
            className="w-full rounded-lg border p-2 text-sm"
            rows={5}
            placeholder="Description"
            {...register("description")}
          />

          {type === "Help" && (
            <div className="space-y-3">
              <input
                className="w-full rounded-lg border p-2 text-sm"
                placeholder="Tags (housing, visa, docs)"
                {...register("tags")}
              />
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                {TAG_SUGGESTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border px-3 py-1 hover:bg-slate-50"
                    onClick={() => {
                      const existing = (getValues("tags") || "")
                        .split(",")
                        .map((v) => v.trim().toLowerCase())
                        .filter(Boolean);
                      if (existing.includes(tag.toLowerCase())) return;
                      const next = [...existing, tag].join(", ");
                      setValue("tags", next, { shouldDirty: true });
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formValues.anonymous}
                  onChange={(event) =>
                    setValue("anonymous", event.target.checked, { shouldDirty: true })
                  }
                />
                Post anonymously
              </label>
            </div>
          )}

          {type === "Housing" && (
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded-lg border p-2 text-sm"
                {...register("housingMode")}
              >
                <option>Looking</option>
                <option>Offering</option>
              </select>
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Rent budget"
                {...register("rent")}
              />
              <input
                className="rounded-lg border p-2 text-sm"
                type="date"
                placeholder="Move-in date"
                {...register("moveIn")}
              />
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Preferences"
                {...register("preferences")}
              />
            </div>
          )}

          {type === "Job" && (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Role"
                {...register("jobRole")}
              />
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Company"
                {...register("company")}
              />
              <select
                className="rounded-lg border p-2 text-sm"
                {...register("remote")}
              >
                <option>Onsite</option>
                <option>Remote</option>
                <option>Hybrid</option>
              </select>
              <select
                className="rounded-lg border p-2 text-sm"
                {...register("referral")}
              >
                <option>Referral</option>
                <option>Offer</option>
              </select>
              <input
                className="rounded-lg border p-2 text-sm md:col-span-2"
                placeholder="Requirements"
                {...register("requirements")}
              />
            </div>
          )}

          {type === "Event" && (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Date & time"
                {...register("eventDate")}
              />
              <select
                className="rounded-lg border p-2 text-sm"
                {...register("fee")}
              >
                <option>Free</option>
                <option>Paid</option>
              </select>
            </div>
          )}

          {type === "Service" && (
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Category"
                {...register("serviceCategory")}
              />
              <input
                className="rounded-lg border p-2 text-sm"
                placeholder="Price range"
                {...register("priceRange")}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formValues.contact === "DM"}
                onChange={() => setValue("contact", "DM", { shouldDirty: true })}
              />
              DM
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={formValues.contact === "Phone"}
                onChange={() => setValue("contact", "Phone", { shouldDirty: true })}
              />
              Phone
            </label>
            <label className="flex items-center gap-2">
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
              <HiOutlinePhoto className="text-slate-500" /> Add photos
            </label>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <button
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </button>
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={publish}
            disabled={loading || !canPublish}
          >
            {loading ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <button
                className="rounded-full border px-3 py-1 text-sm"
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-500">{type}</p>
              <h4 className="text-lg font-semibold">{composed.title}</h4>
              <p className="text-sm text-slate-600 whitespace-pre-line">
                {composed.body}
              </p>
              <p className="text-xs text-slate-500">📍 {location || "No location"}</p>
            </div>
            <button
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={publish}
              disabled={loading || !canPublish}
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-white px-4 py-2 text-sm text-slate-600 shadow">
          {toast}
        </div>
      )}
    </main>
  );
}
