import { Suspense } from "react";
import CreatePostClient from "./CreatePostClient";

export const dynamic = "force-dynamic";

export default function CreatePostPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm text-slate-600">Loading editor...</p>
        </main>
      }
    >
      <CreatePostClient />
    </Suspense>
  );
}
