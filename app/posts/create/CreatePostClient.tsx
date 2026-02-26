"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftEllipsis,
  HiOutlinePhoto,
} from "react-icons/hi2";
import PlacesAutocomplete from "@/components/PlacesAutocomplete";

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
  const [jobMode, setJobMode] = useState<"Openings" | "Seeker">("Openings");
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showFullEventAddress, setShowFullEventAddress] = useState(false);

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
      eventLocation: "",
      fee: "Free",
      eventStartDate: "",
      eventStartTime: "",
      eventEndDate: "",
      eventEndTime: "",
      timezone: "GMT +05:30",
      eventCategory: "",
      eventAudience: "Public",
      eventAddress: "",
      serviceCategory: "",
      priceRange: "",
    },
  });
  const formValues = watch();
  const eventLocation = watch("eventLocation");

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
        `Post type: ${jobMode === "Openings" ? "Job opening" : "Job seeker"}`,
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
      const whenParts: string[] = [];
      if (formValues.eventStartDate) whenParts.push(formValues.eventStartDate);
      if (formValues.eventStartTime) whenParts.push(formValues.eventStartTime);
      if (formValues.eventEndDate) whenParts.push(`- ${formValues.eventEndDate}`);
      if (formValues.eventEndTime) whenParts.push(formValues.eventEndTime);
      if (formValues.timezone) whenParts.push(`(${formValues.timezone})`);
      const whenText = whenParts.length ? `When: ${whenParts.join(" ")}` : "";

      const whereText = [formValues.eventLocation, formValues.eventAddress]
        .filter(Boolean)
        .join(", ");

      description = [
        formValues.description,
        whenText,
        whereText && `Where: ${whereText}`,
        formValues.eventCategory && `Category: ${formValues.eventCategory}`,
        formValues.eventAudience && `Audience: ${formValues.eventAudience}`,
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
  }, [formValues, type, jobMode]);

  const canPublish = composed.title.length >= 3 && composed.body.length >= 10;
  const eventShareText =
    type === "Event"
      ? (() => {
          const whenParts: string[] = [];
          if (formValues.eventStartDate) whenParts.push(formValues.eventStartDate);
          if (formValues.eventStartTime) whenParts.push(formValues.eventStartTime);
          if (formValues.eventEndDate) whenParts.push(`- ${formValues.eventEndDate}`);
          if (formValues.eventEndTime) whenParts.push(formValues.eventEndTime);
          if (formValues.timezone) whenParts.push(`(${formValues.timezone})`);
          const whenText = whenParts.length ? `When: ${whenParts.join(" ")}` : "";

          const whereText = [formValues.eventLocation, formValues.eventAddress]
            .filter(Boolean)
            .join(", ");

          return [
            composed.title,
            whenText,
            whereText && `Where: ${whereText}`,
            formValues.fee && `Fee: ${formValues.fee}`,
          ]
            .filter(Boolean)
            .join(" | ");
        })()
      : "";
  const eventQrUrl = eventShareText
    ? `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(
        eventShareText
      )}`
    : "";

  const handleJobSearch = () => {
    // Simple search redirection built from seeker inputs
    const role = getValues("jobRole");
    const category = getValues("tags");
    const parts = [role, category, location].filter(Boolean);
    const query = parts.length
      ? `?q=${encodeURIComponent(parts.join(" "))}`
      : "";
    router.push(`/home${query}`);
  };

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
          locationContext:
            type === "Event"
              ? values.eventLocation || location || undefined
              : location || undefined,
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
      {type === "Job" ? (
        <>
          <header className="flex items-center gap-3">
            <button
              className="rounded-full border px-3 py-1 text-sm"
              onClick={() => router.back()}
            >
              ←
            </button>
            <h1 className="text-lg font-semibold">Jobs</h1>
          </header>

          <section className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-6 text-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">
                  Powered by Rekkomo
                </p>
                <h2 className="mt-1 text-2xl font-semibold">Jobs</h2>
              </div>
            </div>
              <div className="mt-6 rounded-3xl bg-white p-4 text-slate-900 shadow-lg">
              <div className="flex rounded-full bg-slate-100 p-1 text-sm font-medium">
                {["Openings", "Seeker"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`flex-1 rounded-full px-4 py-2 ${
                      jobMode === mode
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600"
                    }`}
                    onClick={() =>
                      setJobMode(mode === "Openings" ? "Openings" : "Seeker")
                    }
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Job title
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter job title"
                    {...register("jobRole")}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    {...register("tags")}
                  >
                    <option value="">@example123</option>
                    <option value="Tech">Tech</option>
                    <option value="Design">Design</option>
                    <option value="Product">Product</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Location
                  </label>
                  <PlacesAutocomplete
                    value={location}
                    onChange={(value) => setLocation(value)}
                    placeholder="Search your city, state, country.."
                    type="city"
                    className="rounded-xl border-0 bg-transparent px-0 py-0 text-sm"
                    wrapperClassName="rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                  />
                </div>

                {jobMode === "Openings" && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        Job description
                      </label>
                      <textarea
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        rows={4}
                        maxLength={250}
                        placeholder="Describe the role, responsibilities, and who you're looking for..."
                        {...register("description")}
                      />
                      <div className="flex justify-end text-[11px] text-slate-400">
                        {(formValues.description || "").length}/250
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          Company
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Company name"
                          {...register("company")}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          Work mode
                        </label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          {...register("remote")}
                        >
                          <option>Onsite</option>
                          <option>Remote</option>
                          <option>Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-600">
                          Type
                        </label>
                        <select
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          {...register("referral")}
                        >
                          <option>Referral</option>
                          <option>Offer</option>
                        </select>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-slate-600">
                          Requirements
                        </label>
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Skills, experience, notice period..."
                          {...register("requirements")}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formValues.contact === "DM"}
                          onChange={() =>
                            setValue("contact", "DM", { shouldDirty: true })
                          }
                        />
                        DM
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={formValues.contact === "Phone"}
                          onChange={() =>
                            setValue("contact", "Phone", { shouldDirty: true })
                          }
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

                    {error && (
                      <p className="mt-2 text-xs text-red-600">{error}</p>
                    )}
                  </>
                )}

                <button
                  className="mt-4 w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                  onClick={jobMode === "Openings" ? publish : handleJobSearch}
                  disabled={jobMode === "Openings" ? loading || !canPublish : false}
                >
                  {jobMode === "Openings" ? "Post opening" : "Search a Job"}
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
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
            {type === "Event" && (
              <label className="mb-4 flex h-40 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                />
                {file ? (
                  <span className="text-xs font-medium text-blue-600">
                    Change event cover image
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-1">
                    <HiOutlinePhoto className="text-lg text-slate-400" />
                    <span>Add event cover image</span>
                  </span>
                )}
              </label>
            )}

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
                placeholder={type === "Event" ? "Event title" : "Title"}
                {...register("title")}
              />

              {type === "Event" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Time zone
                    </label>
                    <input
                      className="w-full rounded-lg border p-2 text-sm"
                      {...register("timezone")}
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        Start date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border p-2 text-sm"
                        {...register("eventStartDate")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        Start time
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-lg border p-2 text-sm"
                        {...register("eventStartTime")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        End date
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-lg border p-2 text-sm"
                        {...register("eventEndDate")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-600">
                        End time
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-lg border p-2 text-sm"
                        {...register("eventEndTime")}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Location
                    </label>
                    <PlacesAutocomplete
                      value={eventLocation || ""}
                      onChange={(value) => setValue("eventLocation", value)}
                      placeholder="Enter event location"
                      type="city"
                      className="w-full rounded-lg border p-2 text-sm"
                    />
                    <button
                      type="button"
                      className="mt-1 text-xs font-medium text-blue-600"
                      onClick={() =>
                        setShowFullEventAddress((prev) => !prev)
                      }
                    >
                      {showFullEventAddress
                        ? "Hide complete address"
                        : "+ Add complete address"}
                    </button>
                    {showFullEventAddress && (
                      <input
                        className="mt-2 w-full rounded-lg border p-2 text-sm"
                        placeholder="Flat / Street / Landmark"
                        {...register("eventAddress")}
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Event description
                    </label>
                    <textarea
                      className="w-full rounded-lg border p-2 text-sm"
                      rows={5}
                      placeholder="Add event description"
                      {...register("description")}
                    />
                    <div className="flex justify-end text-[11px] text-slate-400">
                      {(formValues.description || "").length}/2000
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Category
                    </label>
                    <select
                      className="w-full rounded-lg border p-2 text-sm"
                      {...register("eventCategory")}
                    >
                      <option value="">Select event category</option>
                      <option value="Community">Community</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Festival">Festival</option>
                      <option value="Meetup">Meetup</option>
                      <option value="Workshop">Workshop</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      Event audience
                    </label>
                    <select
                      className="w-full rounded-lg border p-2 text-sm"
                      {...register("eventAudience")}
                    >
                      <option value="Public">Public (Anyone on the app)</option>
                      <option value="Community">Community only</option>
                      <option value="Private">Private / Invite only</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
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
                            setValue("anonymous", event.target.checked, {
                              shouldDirty: true,
                            })
                          }
                        />
                        Post anonymously
                      </label>
                    </div>
                  )}
                </>
              )}

              {type === "Housing" && (
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
                        setValue("anonymous", event.target.checked, {
                          shouldDirty: true,
                        })
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
                    onChange={() =>
                      setValue("contact", "Phone", { shouldDirty: true })
                    }
                  />
                  Phone
                </label>
                {type !== "Event" && (
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
                )}
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
                {loading
                  ? type === "Event"
                    ? "Creating..."
                    : "Publishing..."
                  : type === "Event"
                  ? "Create an Event"
                  : "Publish"}
              </button>
            </div>
          </div>
        </>
      )}

      {previewOpen && type !== "Job" && (
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
              <p className="text-xs text-slate-500">
                📍{" "}
                {type === "Event"
                  ? formValues.eventLocation || location || "No location"
                  : location || "No location"}
              </p>
              {type === "Event" && eventQrUrl && (
                <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    Share event (QR)
                  </p>
                  <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
                    <img
                      src={eventQrUrl}
                      alt="Event QR code"
                      className="h-32 w-32 rounded-lg border bg-white p-2"
                    />
                    <p className="text-xs text-slate-500">
                      Scan to share event details.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={publish}
              disabled={loading || !canPublish}
            >
              {loading
                ? type === "Event"
                  ? "Creating..."
                  : "Publishing..."
                : type === "Event"
                ? "Create an Event"
                : "Publish"}
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
