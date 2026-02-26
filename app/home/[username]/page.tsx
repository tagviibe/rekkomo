"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeFeedPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to community page (new home page)
    router.replace("/community");
  }, [router]);

  return null;
}
