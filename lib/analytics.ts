export function trackEvent(name: string, payload?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") {
    console.log(`[analytics] ${name}`, payload ?? {});
  }
}
