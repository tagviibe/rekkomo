"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export default function CreateCommunityPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length >= 3;

  const submit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      let avatar: string | undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "community");
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Image upload failed");
        }
        const data = await uploadRes.json();
        avatar = data.url;
      }

      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: toSlug(name),
          type: "INTERSTATE",
          description: description.trim() || undefined,
          avatar,
          visibility: "PUBLIC",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Create failed");
      }
      const data = await res.json();
      router.push(`/communities/${data.community.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <header className="flex items-center gap-3">
        <button
          className="rounded-full border px-3 py-1 text-sm"
          onClick={() => router.back()}
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Community</h1>
      </header>

      <section className="mt-10 flex flex-col items-center">
        <div className="relative h-24 w-24 overflow-hidden rounded-2xl border bg-slate-100">
          {file ? (
            <Image
              src={URL.createObjectURL(file)}
              alt="Community avatar"
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full" />
          )}
        </div>
        <label className="mt-3 text-sm font-semibold text-blue-600">
          {file ? "Remove Photo" : "Add Photo"}
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(event) =>
              setFile(event.target.files?.[0] ?? null)
            }
          />
        </label>
        {file && (
          <button
            className="mt-2 text-xs text-slate-500"
            onClick={() => setFile(null)}
          >
            Clear image
          </button>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <div>
          <label className="text-sm text-slate-600">Community name</label>
          <input
            className="mt-2 w-full rounded-xl border bg-white p-3 text-sm"
            placeholder="Community name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-slate-600">Job description</label>
          <div className="relative">
            <textarea
              className="mt-2 w-full rounded-xl border bg-white p-3 text-sm"
              placeholder="Describe your community..."
              rows={6}
              maxLength={2000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <span className="absolute bottom-2 right-3 text-xs text-slate-400">
              {description.length}/2000
            </span>
          </div>
        </div>
      </section>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        className="mt-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
        onClick={submit}
        disabled={loading || !canSubmit}
      >
        {loading ? "Creating..." : "+ Create community"}
      </button>
    </main>
  );
}
