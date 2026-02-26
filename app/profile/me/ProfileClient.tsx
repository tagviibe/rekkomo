"use client";

import Image from "next/image";
import { useState } from "react";

type ProfileData = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bio?: string | null;
  phone?: string | null;
  nativePlace?: string | null;
  originCountry?: string | null;
  originState?: string | null;
  originCity?: string | null;
  currentCountry?: string | null;
  currentState?: string | null;
  currentCity?: string | null;
  currentLocality?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  interests?: string[] | null;
  languages?: string[] | null;
  communities?: string[] | null;
  needs?: string[] | null;
  canOffer?: string[] | null;
  profession?: string | null;
  movedToCityWhen?: string | null;
  profileVisibility?: "PUBLIC" | "COMMUNITY_ONLY" | "PRIVATE" | null;
  showNativePlace?: boolean | null;
  showActivity?: boolean | null;
  allowFollow?: boolean | null;
  showEmail?: boolean | null;
  showPhone?: boolean | null;
  showApproxLocation?: boolean | null;
};

export default function ProfileClient({
  initial,
  startEditing = false,
}: {
  initial: ProfileData;
  startEditing?: boolean;
}) {
  const [editing, setEditing] = useState(startEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: initial.name ?? "",
    bio: initial.bio ?? "",
    phone: initial.phone ?? "",
    nativePlace: initial.nativePlace ?? "",
    originCountry: initial.originCountry ?? "",
    originState: initial.originState ?? "",
    originCity: initial.originCity ?? "",
    currentCountry: initial.currentCountry ?? "",
    currentState: initial.currentState ?? "",
    currentCity: initial.currentCity ?? "",
    currentLocality: initial.currentLocality ?? "",
    gender: initial.gender ?? "",
    dateOfBirth: initial.dateOfBirth ?? "",
    interests: (initial.interests ?? []).join(", "),
    languages: (initial.languages ?? []).join(", "),
    communities: (initial.communities ?? []).join(", "),
    needs: (initial.needs ?? []).join(", "),
    canOffer: (initial.canOffer ?? []).join(", "),
    profession: initial.profession ?? "",
    movedToCityWhen: initial.movedToCityWhen ?? "",
    profileVisibility: initial.profileVisibility ?? "PUBLIC",
    showNativePlace: initial.showNativePlace ?? true,
    showActivity: initial.showActivity ?? true,
    allowFollow: initial.allowFollow ?? true,
    showEmail: Boolean(initial.showEmail),
    showPhone: Boolean(initial.showPhone),
    showApproxLocation: initial.showApproxLocation ?? true,
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      let imageUrl = initial.image ?? undefined;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", "profile");
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

      const res = await fetch("/api/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bio: form.bio,
          phone: form.phone,
          nativePlace: form.nativePlace,
          originCountry: form.originCountry,
          originState: form.originState,
          originCity: form.originCity,
          currentCountry: form.currentCountry,
          currentState: form.currentState,
          currentCity: form.currentCity,
          currentLocality: form.currentLocality,
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          profession: form.profession || undefined,
          movedToCityWhen: form.movedToCityWhen || undefined,
          interests: form.interests
            ? form.interests.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          languages: form.languages
            ? form.languages.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          communities: form.communities
            ? form.communities.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          needs: form.needs
            ? form.needs.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          canOffer: form.canOffer
            ? form.canOffer.split(",").map((v) => v.trim()).filter(Boolean)
            : [],
          profileVisibility: form.profileVisibility,
          showNativePlace: form.showNativePlace,
          showActivity: form.showActivity,
          allowFollow: form.allowFollow,
          showEmail: form.showEmail,
          showPhone: form.showPhone,
          showApproxLocation: form.showApproxLocation,
          image: imageUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed");
      }
      setEditing(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <button
          className="rounded-lg border px-3 py-1 text-sm"
          onClick={() => setEditing((prev) => !prev)}
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4">
            {initial.image ? (
              <Image
                src={initial.image}
                alt="Profile"
                width={64}
                height={64}
                className="rounded-2xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-slate-100" />
            )}
            <label className="text-sm text-slate-600">
              Upload photo
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Full name"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <textarea
            className="w-full rounded border p-2 text-sm"
            rows={3}
            placeholder="Bio"
            value={form.bio}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, bio: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Native place"
            value={form.nativePlace}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, nativePlace: event.target.value }))
            }
          />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded border p-2 text-sm"
              placeholder="Origin country"
              value={form.originCountry}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  originCountry: event.target.value,
                }))
              }
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Origin state"
              value={form.originState}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, originState: event.target.value }))
              }
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Origin city"
              value={form.originCity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, originCity: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded border p-2 text-sm"
              placeholder="Current country"
              value={form.currentCountry}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  currentCountry: event.target.value,
                }))
              }
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Current state"
              value={form.currentState}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  currentState: event.target.value,
                }))
              }
            />
            <input
              className="rounded border p-2 text-sm"
              placeholder="Current city"
              value={form.currentCity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, currentCity: event.target.value }))
              }
            />
          </div>
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Current locality"
            value={form.currentLocality}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, currentLocality: event.target.value }))
            }
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="rounded border p-2 text-sm"
              value={form.gender}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gender: event.target.value }))
              }
            >
              <option value="">Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_SAY">Prefer not to say</option>
            </select>
            <input
              type="date"
              className="rounded border p-2 text-sm"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))
              }
            />
          </div>
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Profession"
            value={form.profession}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, profession: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Interests (comma separated)"
            value={form.interests}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, interests: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Languages (comma separated)"
            value={form.languages}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, languages: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Community tags (comma separated)"
            value={form.communities}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, communities: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Needs (comma separated)"
            value={form.needs}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, needs: event.target.value }))
            }
          />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Can offer (comma separated)"
            value={form.canOffer}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, canOffer: event.target.value }))
            }
          />
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.profileVisibility === "PUBLIC"}
                onChange={() =>
                  setForm((prev) => ({ ...prev, profileVisibility: "PUBLIC" }))
                }
              />
              Public
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.profileVisibility === "COMMUNITY_ONLY"}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    profileVisibility: "COMMUNITY_ONLY",
                  }))
                }
              />
              Community only
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={form.profileVisibility === "PRIVATE"}
                onChange={() =>
                  setForm((prev) => ({ ...prev, profileVisibility: "PRIVATE" }))
                }
              />
              Private
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showEmail}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    showEmail: event.target.checked,
                  }))
                }
              />
              Show email
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showPhone}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    showPhone: event.target.checked,
                  }))
                }
              />
              Show phone
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showApproxLocation}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    showApproxLocation: event.target.checked,
                  }))
                }
              />
              Show approx location
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showNativePlace}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    showNativePlace: event.target.checked,
                  }))
                }
              />
              Show native place
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.showActivity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    showActivity: event.target.checked,
                  }))
                }
              />
              Show activity
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.allowFollow}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    allowFollow: event.target.checked,
                  }))
                }
              />
              Allow follow
            </label>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
